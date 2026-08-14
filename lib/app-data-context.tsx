"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import {
  homes as initialHomes,
  people as initialPeople,
  initialMyRequests,
  initialQueue,
  initialMyJobGroups,
  initialCompleted,
  initialNotifGroups,
  initialNotifPrefs,
  initialActivity,
  initialUnassigned,
  type Home,
  type Person,
  type MaintenanceRequest,
  type QueueJob,
  type MyJobGroup,
  type CompletedJob,
  type NotifGroup,
  type NotifPref,
  type ActivityEntry,
  type UnassignedJob,
} from "./fixtures";
import type { Priority } from "./theme";

type State = {
  homes: Home[];
  people: Person[];
  myRequests: MaintenanceRequest[];
  queue: QueueJob[];
  myJobGroups: MyJobGroup[];
  completed: CompletedJob[];
  notifGroups: NotifGroup[];
  notifPrefs: NotifPref[];
  activity: ActivityEntry[];
  unassigned: UnassignedJob[];
};

const initialState: State = {
  homes: initialHomes,
  people: initialPeople,
  myRequests: initialMyRequests,
  queue: initialQueue,
  myJobGroups: initialMyJobGroups,
  completed: initialCompleted,
  notifGroups: initialNotifGroups,
  notifPrefs: initialNotifPrefs,
  activity: initialActivity,
  unassigned: initialUnassigned,
};

type NewRequestInput = {
  title: string;
  location: string;
  category: string;
  description: string;
  priority: Priority;
  urgent: boolean;
};

type Action =
  | { type: "SUBMIT_REQUEST"; input: NewRequestInput }
  | { type: "ACCEPT_JOB"; ref: string }
  | { type: "SET_STAGE"; ref: string; stage: "accepted" | "site" | "parts" }
  | { type: "MARK_COMPLETED"; ref: string }
  | { type: "ADD_COMMENT"; text: string }
  | { type: "MARK_ALL_READ" }
  | { type: "TOGGLE_NOTIF_PREF"; id: string }
  | { type: "ASSIGN_JOB"; ref: string; assignee: string }
  | { type: "ADD_HOME"; home: Home }
  | { type: "HYDRATE"; state: State };

function nextRef(existing: string[], prefix = "WH") {
  const nums = existing
    .filter((r) => r.startsWith(prefix + "-"))
    .map((r) => parseInt(r.split("-")[1] ?? "0", 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 400;
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE":
      return action.state;
    case "SUBMIT_REQUEST": {
      const ref = nextRef(state.myRequests.map((r) => r.ref));
      const request: MaintenanceRequest = {
        ref,
        title: action.input.title,
        location: action.input.location,
        category: action.input.category,
        priority: action.input.urgent ? "Urgent" : action.input.priority,
        status: "Open",
        when: "just now",
        photos: 0,
        unread: false,
      };
      return { ...state, myRequests: [request, ...state.myRequests] };
    }
    case "ACCEPT_JOB": {
      return {
        ...state,
        queue: state.queue.map((j) =>
          j.ref === action.ref
            ? { ...j, assignee: "Marcus Okoro", action: "Open" }
            : j
        ),
      };
    }
    case "SET_STAGE": {
      return {
        ...state,
        myJobGroups: state.myJobGroups.map((g) => ({
          ...g,
          items: g.items.map((j) =>
            j.ref === action.ref ? { ...j, stage: action.stage } : j
          ),
        })),
      };
    }
    case "MARK_COMPLETED": {
      let completedJob: CompletedJob | null = null;
      const myJobGroups = state.myJobGroups.map((g) => ({
        ...g,
        items: g.items.filter((j) => {
          if (j.ref === action.ref) {
            completedJob = {
              ref: j.ref,
              title: j.title,
              home: j.meta.split(" · ")[0],
              done: "just now",
              onJob: "—",
              photos: 1,
              outcome: "Fixed",
            };
            return false;
          }
          return true;
        }),
      }));
      return {
        ...state,
        myJobGroups,
        completed: completedJob ? [completedJob, ...state.completed] : state.completed,
        queue: state.queue.filter((j) => j.ref !== action.ref),
      };
    }
    case "ADD_COMMENT": {
      const entry: ActivityEntry = {
        id: `a-${Date.now()}`,
        initials: "MO",
        who: "Marcus Okoro",
        time: "now",
        text: action.text,
      };
      return { ...state, activity: [...state.activity, entry] };
    }
    case "MARK_ALL_READ": {
      return {
        ...state,
        notifGroups: state.notifGroups.map((g) => ({
          ...g,
          items: g.items.map((i) => ({ ...i, unread: false })),
        })),
      };
    }
    case "TOGGLE_NOTIF_PREF": {
      return {
        ...state,
        notifPrefs: state.notifPrefs.map((p) =>
          p.id === action.id ? { ...p, on: !p.on } : p
        ),
      };
    }
    case "ASSIGN_JOB": {
      return {
        ...state,
        unassigned: state.unassigned.filter((u) => u.ref !== action.ref),
      };
    }
    case "ADD_HOME": {
      return { ...state, homes: [...state.homes, action.home] };
    }
    default:
      return state;
  }
}

const STORAGE_KEY = "upkeep-app-data";

type ContextValue = State & {
  submitNewRequest: (input: NewRequestInput) => void;
  acceptJob: (ref: string) => void;
  setJobStage: (ref: string, stage: "accepted" | "site" | "parts") => void;
  markJobCompleted: (ref: string) => void;
  addComment: (text: string) => void;
  markAllRead: () => void;
  toggleNotifPref: (id: string) => void;
  assignJob: (ref: string, assignee: string) => void;
  addHome: (home: Home) => void;
};

const AppDataContext = createContext<ContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        dispatch({ type: "HYDRATE", state: JSON.parse(raw) });
      } catch {
        // ignore malformed storage
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const submitNewRequest = useCallback(
    (input: NewRequestInput) => dispatch({ type: "SUBMIT_REQUEST", input }),
    []
  );
  const acceptJob = useCallback(
    (ref: string) => dispatch({ type: "ACCEPT_JOB", ref }),
    []
  );
  const setJobStage = useCallback(
    (ref: string, stage: "accepted" | "site" | "parts") =>
      dispatch({ type: "SET_STAGE", ref, stage }),
    []
  );
  const markJobCompleted = useCallback(
    (ref: string) => dispatch({ type: "MARK_COMPLETED", ref }),
    []
  );
  const addComment = useCallback(
    (text: string) => dispatch({ type: "ADD_COMMENT", text }),
    []
  );
  const markAllRead = useCallback(() => dispatch({ type: "MARK_ALL_READ" }), []);
  const toggleNotifPref = useCallback(
    (id: string) => dispatch({ type: "TOGGLE_NOTIF_PREF", id }),
    []
  );
  const assignJob = useCallback(
    (ref: string, assignee: string) =>
      dispatch({ type: "ASSIGN_JOB", ref, assignee }),
    []
  );
  const addHome = useCallback(
    (home: Home) => dispatch({ type: "ADD_HOME", home }),
    []
  );

  const value = useMemo<ContextValue>(
    () => ({
      ...state,
      submitNewRequest,
      acceptJob,
      setJobStage,
      markJobCompleted,
      addComment,
      markAllRead,
      toggleNotifPref,
      assignJob,
      addHome,
    }),
    [
      state,
      submitNewRequest,
      acceptJob,
      setJobStage,
      markJobCompleted,
      addComment,
      markAllRead,
      toggleNotifPref,
      assignJob,
      addHome,
    ]
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
