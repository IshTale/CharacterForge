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
    <div className="rounded-lg border border-mint-300 bg-mint-100/50 p-2 text-xs font-medium text-plum-800">
      Status: {LABEL[status]}
    </div>
  );
}
