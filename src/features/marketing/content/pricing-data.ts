export const plans = [
  {
    name: "Starter",
    price: { monthly: 0, yearly: 0 },
    description: "Perfect for those just starting their journey",
    features: [
      "Smart Creator Hub",
      "Search Visibility (Basic)",
      "Support: Community",
    ],
    cta: "Start for Free",
    highlight: false,
  },
  {
    name: "Pro",
    price: { monthly: 690, yearly: 550 },
    description: "For creators who want to grow faster",
    features: [
      "Smart Creator Hub",
      "Search Visibility (Advanced)",
      "Audience Connect",
      "Content Boosting (Limited)",
      "Support: Email",
    ],
    cta: "Get Pro Plan",
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Business",
    price: { monthly: 1690, yearly: 1390 },
    description: "Full solution for businesses and brands",
    features: [
      "Smart Creator Hub",
      "Search Visibility (Priority)",
      "Audience Connect",
      "Content Boosting (Unlimited)",
      "Multi-Channel Sync",
      "Growth Analytics (Real-time)",
      "Support: 24/7 Priority",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

export const pricingFeatures = [
  {
    id: "smart-hub",
    name: "Smart Creator Hub",
    tooltip:
      "An AI-powered creator hub that helps you write, edit, and optimize your content.",
    starter: true,
    pro: true,
    business: true,
  },
  {
    id: "search-visibility",
    name: "Search Visibility",
    tooltip:
      "Boost your content's visibility on search engines with automatic SEO optimization.",
    starter: "Basic",
    pro: "Advanced",
    business: "Priority",
  },
  {
    id: "audience-connect",
    name: "Audience Connect",
    tooltip:
      "Connect and build relationships with your followers through audience analysis tools.",
    starter: false,
    pro: true,
    business: true,
  },
  {
    id: "content-boosting",
    name: "Content Boosting",
    tooltip:
      "Expand your content's reach with an automated cross-platform promotion system.",
    starter: false,
    pro: "Limited",
    business: "Unlimited",
  },
  {
    id: "multi-channel",
    name: "Multi-Channel Sync",
    tooltip:
      "Sync and publish content to all social media platforms simultaneously in a single click.",
    starter: false,
    pro: false,
    business: true,
  },
  {
    id: "growth-analytics",
    name: "Growth Analytics",
    tooltip:
      "Real-time growth dashboard with deep reports and AI-driven recommendations.",
    starter: false,
    pro: false,
    business: "Real-time",
  },
  {
    id: "support",
    name: "Support",
    tooltip:
      "A support team ready to help you throughout your journey, from onboarding to growth.",
    starter: "Community",
    pro: "Email",
    business: "24/7 Priority",
  },
];

export const faqs = [
  {
    question: "Can I change my plan later?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time through your account settings.",
  },
  {
    question: "Is there a yearly payment offer?",
    answer:
      "Yes! By choosing the yearly plan, you can save up to 20% compared to monthly billing.",
  },
  {
    question: "Is the Business plan right for me?",
    answer:
      "It's ideal for agencies or brands managing multiple channels simultaneously and requiring real-time analytics for precise decision-making.",
  },
];
