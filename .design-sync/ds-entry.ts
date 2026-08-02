/**
 * The design-sync bundle entry.
 *
 * Vision is an app, not a published package, so it has no barrel of its own —
 * this file is that barrel, and it exists only for the sync. Everything
 * exported here lands on `window.VisionDS` and becomes buildable by the
 * Claude Design agent, so adding a component to `components/ui/` means adding
 * it here too.
 */
export { Alert } from "../components/ui/alert";
export { Badge } from "../components/ui/badge";
export { Button } from "../components/ui/button";
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";
export { Checkbox } from "../components/ui/checkbox";
export { default as ConfirmDialog } from "../components/ui/ConfirmDialog";
export { FieldMessage } from "../components/ui/field-message";
export { Input } from "../components/ui/input";
export { Label } from "../components/ui/label";
export {
  Skeleton,
  StatsCardSkeleton,
  RecentPostSkeleton,
  PostRowSkeleton,
} from "../components/ui/Skeleton";
export { Spinner } from "../components/ui/spinner";

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
} from "../components/ui/Icons";
