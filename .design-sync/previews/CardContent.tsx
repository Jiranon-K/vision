import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "vision";

/* CardContent is a slot of Card — rendered alone it is an unstyled box, so the
   preview shows it in the composition it is meant for, highlighted. */
export const InCard = () => (
  <div style={{ maxWidth: 400 }}>
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Growth Analytics</CardTitle>
        <CardDescription>Views and Audience growth, last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-text-secondary">
          3,410 Views from 1,284 Readers — up 18% on the previous period.
        </p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Open report</Button>
      </CardFooter>
    </Card>
  </div>
);
