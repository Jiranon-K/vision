/**
 * The design-sync bundle entry.
 *
 * Vision is an app, not a published package, so it has no barrel of its own —
 * this file is that barrel, and it exists only for the sync. Everything
 * exported here lands on `window.VisionDS` and becomes buildable by the
 * Claude Design agent, so adding a component to `src/components/ui/` means adding
 * it here too.
 */
export { Alert } from "../src/components/ui/alert";
export { Badge } from "../src/components/ui/badge";
export { Button } from "../src/components/ui/button";
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "../src/components/ui/card";
export { Checkbox } from "../src/components/ui/checkbox";
export { default as ConfirmDialog } from "../src/components/ui/ConfirmDialog";
export { FieldMessage } from "../src/components/ui/field-message";
export { Input } from "../src/components/ui/input";
export { Label } from "../src/components/ui/label";
export {
  Skeleton,
  StatsCardSkeleton,
  RecentPostSkeleton,
  PostRowSkeleton,
} from "../src/components/ui/Skeleton";
export { Spinner } from "../src/components/ui/spinner";

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
} from "../src/components/ui/Icons";
