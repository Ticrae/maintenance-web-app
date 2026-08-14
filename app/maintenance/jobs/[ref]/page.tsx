import { JobDetail } from "./job-detail";

export default async function JobDetailPage(
  props: PageProps<"/maintenance/jobs/[ref]">
) {
  const { ref } = await props.params;
  return <JobDetail refParam={ref} />;
}
