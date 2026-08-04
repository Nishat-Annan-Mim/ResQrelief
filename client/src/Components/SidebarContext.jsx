import React, { createContext, useContext, useState, useEffect } from "react";

/*
 * Shares the mobile sidebar's open/closed state between the top bar
 * (NavbarPrivate / NavbarAdmin) and the page shells (UserLayout /
 * AdminLayout). They are siblings in the tree, so the hamburger in the
 * bar cannot reach the sidebar without this.
 *
 * Desktop collapse is deliberately kept as local state inside each
 * layout — it is a different concept from the mobile drawer.
 */
const SidebarContext = createContext({
  mobileOpen: false,
  setMobileOpen: () => {},
  toggleMobile: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the drawer if the viewport grows past the mobile breakpoint,
  // otherwise it can stay "open" invisibly and trap focus.
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Stop the page behind the drawer from scrolling while it is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <SidebarContext.Provider
      value={{
        mobileOpen,
        setMobileOpen,
        toggleMobile: () => setMobileOpen((prev) => !prev),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export default SidebarContext;
