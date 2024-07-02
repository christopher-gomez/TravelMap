import React, { createContext, useContext, useEffect, useState } from "react";
import { Logger, deepEqual } from "./Utils";

// Create a context for the navigation state
const NavigationContext = createContext();

// Custom hook to use the navigation context
export function useStackNavigation() {
  return useContext(NavigationContext);
}

// NavigationProvider component to provide the navigation state to its children
export function StackNavigationProvider({ children }) {
  const [backStack, setBackStack] = useState([]);
  const backStackRef = React.useRef(backStack);
  const [forwardStack, setForwardStack] = useState([]);
  const forwardStackRef = React.useRef(forwardStack);
  const [current, setCurrent] = useState(null);
  const currentRef = React.useRef(current);

  useEffect(() => {
    backStackRef.current = backStack;
    // Logger.Log("backStack updated", backStack);
  }, [backStack]);

  useEffect(() => {
    currentRef.current = current;
    // Logger.Log("current updated", current);
  }, [current]);

  useEffect(() => {
    forwardStackRef.current = forwardStack;
    // Logger.Log("forwardStack updated", forwardStack);
  }, [forwardStack]);

  const push = (page) => {
    // Logger.Log("pushing page", page, currentRef.current);
    if (currentRef.current !== null && page !== currentRef.current) {
      setBackStack([...backStackRef.current, currentRef.current]);
      setForwardStack([]);
    }

    if (
      currentRef.current === null &&
      backStackRef.current.length > 0 &&
      deepEqual(page, backStackRef.current[backStackRef.current.length - 1])
    ) {
      // Logger.Log("found same object at top of backstack");
      const newBackStack = [...backStackRef.current];
      newBackStack.pop();
      setBackStack(newBackStack);
    }

    setCurrent(page);
  };

  const back = () => {
    if (backStack.length > 0) {
      const newBackStack = [...backStackRef.current];
      const previousPage = newBackStack.pop();
      if (
        previousPage !== null &&
        currentRef.current !== null &&
        previousPage !== currentRef.current
      )
        setForwardStack([currentRef.current, ...forwardStackRef.current]);

      setCurrent(previousPage);
      setBackStack(newBackStack);
      //   Logger.Log(`Went back to: ${previousPage}`);
    }
    // else {
    //   Logger.Log("No pages in back history.");
    // }
  };

  const forward = () => {
    if (forwardStackRef.current.length > 0) {
      setBackStack([...backStackRef.current, currentRef.current]);
      const newForwardStack = [...forwardStackRef.current];
      const nextPage = newForwardStack.shift();
      setCurrent(nextPage);
      setForwardStack(newForwardStack);
      //   Logger.Log(`Went forward to: ${nextPage}`);
    }
    // else {
    //   Logger.Log("No pages in forward history.");
    // }
  };

  const clear = () => {
    setBackStack([]);
    setForwardStack([]);
    setCurrent(null);
    // Logger.Log("cleared stack");
  };

  const moveForwardToBack = () => {
    // Logger.Log(
    //   "moving forward to back",
    //   currentRef.current,
    //   forwardStackRef.current
    // );
    if (currentRef.current && forwardStackRef.current.length > 0)
      setBackStack([
        ...forwardStackRef.current,
        currentRef.current,
        ...backStackRef.current,
      ]);
    else if (currentRef.current)
      setBackStack([...backStackRef.current, currentRef.current]);

    setForwardStack([]);
    setCurrent(null);
  };

  return (
    <NavigationContext.Provider
      value={{
        current,
        push,
        back,
        forward,
        canGoBack: backStack.length > 0,
        canGoForward: forwardStack.length > 0,
        clear,
        moveForwardToBack,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}
