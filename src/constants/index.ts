/**
 * Navigation link interface
 */
interface NavLink {
  id: string;
  title: string;
}

/**
 * Application navigation links
 * Defines the main routes available in the application
 */
export const navLinks: NavLink[] = [
  {
    id: "/",
    title: "Home",
  },
  {
    id: "/market",
    title: "Marketplace",
  },
  {
    id: "/create",
    title: "Create Offer",
  },
  {
    id: "/profile",
    title: "Profile",
  },
  // {
  //   id: "/publics",
  //   title: "Publics",
  // },
];
