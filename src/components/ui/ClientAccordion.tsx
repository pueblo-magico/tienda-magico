"use client";

// react-ui 0.2.0 does not preserve a client directive for its React Aria exports.
// Keep this boundary until the package publishes the directive itself.
export { Accordion } from "@pueblo-magico/react-ui";
export type {
  AccordionItem,
  AccordionProps,
} from "@pueblo-magico/react-ui";
