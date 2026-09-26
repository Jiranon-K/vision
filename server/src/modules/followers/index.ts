// The Followers module's interface (ADR 0007, ADR 0009): only what another
// module calls. Anything not exported here, or from followers.routes.ts for
// mounting, is internal to the module.
export { deliverPost, deliveryFigures } from './followers.service';
export { startDeliveryQueue } from './delivery-queue';
