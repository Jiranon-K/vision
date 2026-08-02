import { toast } from "sonner";

export function comingSoonToast(name: string, description: string) {
  toast.info(`${name} isn't available yet`, { description });
}
