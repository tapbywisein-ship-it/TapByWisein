import { LINKS } from "./links";

export type EcosystemStatus = "current" | "reserved" | "available";

export interface EcosystemProduct {
  id: "tapbywisein" | "bywisein" | "wisein";
  name: string;
  tagline: string;
  description: string;
  status: EcosystemStatus;
  /** destination; null = not available yet (rendered as non-navigating) */
  href: string | null;
  /** short text shown in the item's action row */
  action: string;
}

export const ECOSYSTEM: EcosystemProduct[] = [
  {
    id: "tapbywisein",
    name: "TAPWISEIN",
    tagline: "Connect through a tap.",
    description: "Smart physical networking for meaningful first connections.",
    status: "available",
    href: LINKS.tapbywisein,
    action: "Explore TAPWISEIN",
  },
  {
    id: "bywisein",
    name: "BYWISEIN",
    tagline: "Events & opportunities.",
    description: "Create, discover and experience professional events.",
    status: "reserved",
    href: LINKS.bywisein,
    action: "Events experience",
  },
  {
    id: "wisein",
    name: "WISEIN",
    tagline: "The broader platform.",
    description: "Build relationships, discover opportunities and grow your network.",
    status: "available",
    href: LINKS.wisein,
    action: "Explore WiseIN",
  },
];
