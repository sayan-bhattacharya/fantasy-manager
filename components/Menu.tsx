import Login from "./Login";
import {
  Icon,
  MenuItem,
  Container,
  Menu,
  Typography,
  IconButton,
  Toolbar,
  Box,
  AppBar,
  Chip,
} from "@mui/material";
import { MouseEvent, MouseEventHandler, useContext, useState } from "react";
import Link from "./Link";
import { useSession } from "next-auth/react";
import { TranslateContext } from "../Modules/context";

interface MenuItemsInterface {
  pages: { name: string; link: string; badge?: string }[];
  handleCloseNavMenu: MouseEventHandler;
}

function MenuItems({ pages, handleCloseNavMenu }: MenuItemsInterface) {
  return (
    <>
      {pages.map((page) => (
        <Link styled={false} href={page.link} key={page.name}>
          <MenuItem onClick={handleCloseNavMenu}>
            <Typography textAlign="center" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {page.name}
              {page.badge && (
                <Chip
                  label={page.badge}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    bgcolor: "rgba(0,255,135,0.12)",
                    color: "#00FF87",
                    border: "1px solid rgba(0,255,135,0.25)",
                  }}
                />
              )}
            </Typography>
          </MenuItem>
        </Link>
      ))}
    </>
  );
}

interface MainInterface {
  league?: number;
}

const Layout = ({ league }: MainInterface) => {
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const handleOpenNavMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const { data: session } = useSession();
  if (!league && session) {
    league = session.user.favoriteLeague ? session.user.favoriteLeague : undefined;
  }
  const t = useContext(TranslateContext);

  const pages: { name: string; link: string; badge?: string }[] = [
    { name: "⚽ FantasyKick", link: "/" },
  ];

  pages.push({ name: t("Contests"), link: "/contests", badge: "LIVE" });
  pages.push({ name: t("Download"), link: `/download` });

  if (session || league) {
    if (session?.user.admin) {
      pages.push({ name: "Admin", link: "/admin" });
    }
    pages.push({ name: t("Leagues"), link: "/leagues" });
    pages.push({ name: t("Wallet"), link: "/wallet" });
  }

  if (league) {
    pages.push({ name: t("Standings"), link: `/${league}` });
    pages.push({ name: t("Predictions"), link: `/${league}/${session?.user.id}/predictions` });
    pages.push({ name: t("Squad"), link: `/${league}/squad` });
    pages.push({ name: t("Transfers"), link: `/${league}/transfer` });
  }

  const MenuItemsLarge = (
    <MenuItems pages={pages} handleCloseNavMenu={handleCloseNavMenu} />
  );
  const MenuItemsSmall = (
    <>
      <IconButton size="large" onClick={handleOpenNavMenu} color="inherit">
        <Icon>menu</Icon>
      </IconButton>
      <Menu
        id="menu-appbar"
        anchorEl={anchorElNav}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        keepMounted
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        open={Boolean(anchorElNav)}
        onClose={handleCloseNavMenu}
        sx={{ display: { sm: "block", lg: "none" } }}
      >
        {MenuItemsLarge}
      </Menu>
    </>
  );

  const MenuCount = pages.length;

  return (
    <AppBar
      position="static"
      sx={{
        background: "rgba(5,5,5,0.95)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "none",
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Brand */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mr: 3 }}>
            <span style={{ fontSize: "1.25rem" }}>⚽</span>
            <Typography
              variant="h6"
              component="span"
              sx={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontWeight: 800,
                fontSize: "1rem",
                color: "#00FF87",
                letterSpacing: "-0.02em",
              }}
            >
              FantasyKick
            </Typography>
          </Box>

          {/* Mobile */}
          <Box
            sx={{
              flexGrow: 1,
              display: {
                xs: "flex",
                sm: MenuCount > 5 ? "flex" : "none",
                md: MenuCount > 7 ? "flex" : "none",
                lg: MenuCount > 10 ? "flex" : "none",
                xl: "none",
              },
            }}
          >
            {MenuItemsSmall}
          </Box>

          {/* Desktop */}
          <Box
            sx={{
              flexGrow: 1,
              display: {
                xs: "none",
                sm: MenuCount > 5 ? "none" : "flex",
                md: MenuCount > 7 ? "none" : "flex",
                lg: MenuCount > 10 ? "none" : "flex",
                xl: "flex",
              },
            }}
          >
            {MenuItemsLarge}
          </Box>

          <Box sx={{ flexGrow: 0 }}>
            <Login />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Layout;
