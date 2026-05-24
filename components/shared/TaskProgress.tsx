interface TaskProgressProps {
  status: "idle" | "uploading" | "processing" | "success" | "error";
}

const LABEL: Record<TaskProgressProps["status"], string> = {
  idle: "Idle",
  uploading: "Uploading",
  processing: "Processing",
  success: "Complete",
  error: "Error"
};

export default function TaskProgress({ status }: TaskProgressProps) {
  return (
    <div className="rounded border border-gray-700 p-2 text-xs text-gray-300">
      Status: {LABEL[status]}
    </div>
  );
}
