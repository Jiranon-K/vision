// The Followers module's interface (ADR 0007, ADR 0009). Anything not exported
// here, or from followers.routes.ts for mounting, is internal to the module.
export { deliverPost, deliveryOf, deliveryFigures, followerCount } from './followers.service';
export { drainDeliveries, startDeliveryQueue, sendableToday } from './sending';
