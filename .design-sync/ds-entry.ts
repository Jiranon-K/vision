/**
 * The design-sync bundle entry.
 *
 * Vision is an app, not a published package, so it has no barrel of its own —
 * this file is that barrel, and it exists only for the sync. Everything
 * exported here lands on `window.VisionDS` and becomes buildable by the
 * Claude Design agent, so adding a component to `src/shared/ui/` means adding
 * it here too.
 */
export { Alert } from "../src/shared/ui/alert";
export { Badge } from "../src/shared/ui/badge";
export { Button } from "../src/shared/ui/button";
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "../src/shared/ui/card";
export { Checkbox } from "../src/shared/ui/checkbox";
export { default as ConfirmDialog } from "../src/shared/ui/confirm-dialog";
export { FieldMessage } from "../src/shared/ui/field-message";
export { Input } from "../src/shared/ui/input";
export { Label } from "../src/shared/ui/label";
export {
  Skeleton,
  StatsCardSkeleton,
  RecentPostSkeleton,
  PostRowSkeleton,
} from "../src/shared/ui/skeleton";
export { Spinner } from "../src/shared/ui/spinner";

export {
  DashboardIcon,
  EyeIcon,
  EyeOffIcon,
  PostsIcon,
  AnalyticsIcon,
  SettingsIcon,
  LogoIcon,
  LogoutIcon,
  HomeIcon,
  EditIcon,
  DeleteIcon,
  PlusIcon,
  UploadIcon,
  ChartIcon,
} from "../src/shared/ui/icons";
