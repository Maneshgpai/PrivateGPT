import { Disclosure } from "@headlessui/react";
import Header from "./Header";
import { useEffect, useState } from "react";
import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar from '@mui/material/AppBar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import { Settings } from '@mui/icons-material';
import Link from 'next/link';
import NewReleasesRoundedIcon from '@mui/icons-material/NewReleasesRounded';
import { Tooltip } from '@mui/material';

const drawerWidth = 240;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

export default function Layout(props) {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const sideData = [
    {
      name: "Generate codes",
      icon: <HomeRoundedIcon />,
      link: "/",
    },
    {
      name: "Settings",
      icon: <Settings />,
      link: "/settings",
    },

  ]

  return (
    <div>

      <Header toggleSidebar={toggleSidebar} />
      <Box sx={{ display: 'flex', minWidth: 300 }}  >
        <CssBaseline />
        {/* TOP APP BAR  */}
        {/* <AppBar position="fixed" open={open} style={{ backgroundColor: "#ebeef4", color: "#000" }}>
        <Toolbar style={{ backgroundColor: "#ebeef4", color: "#000" }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{
              marginRight: 5,
              ...(open && { display: 'none' }),
            }}>
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar> */}

        <Drawer variant="permanent" open={open} style={{ backgroundColor: "#ebeef4", color: "#000" }} >
          {/* <DrawerHeader > */}
          {/* <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <MenuIcon />}
          </IconButton> */}
          {/* </DrawerHeader> */}
          {/* <Divider /> */}

          <List style={{ backgroundColor: "#ebeef4", color: "#000" }}>
            {sideData.map((item, index) => (
              <ListItem key={index} disablePadding sx={{ display: 'block' }} style={{ backgroundColor: "#ebeef4", color: "#000" }}>
                <Link href={item?.link}
                  rel="noreferrer">
                  <Tooltip title={item?.name} placement="right" >
                    <ListItemButton
                      sx={{ minHeight: 48, justifyContent: open ? 'initial' : 'center', px: 2.5, }} >
                      <ListItemIcon
                        sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center', }}>
                        {item?.icon}
                        {/* {item?.name} */}
                      </ListItemIcon>
                      {/* <ListItemText primary={item?.name} sx={{ opacity: open ? 1 : 0 }} /> */}
                    </ListItemButton>
                  </Tooltip>
                </Link>
              </ListItem>
            ))}
          </List>
          {/* <Divider /> */}
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, p: 3 }}
        >
          <div className="flex flex-grow flex-col md:flex-row w-full overflow-y-auto" >
            {props.children}
          </div>
        </Box>

      </Box>
    </div>
  );
}
