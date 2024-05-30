import React, { createContext, useContext, useEffect, useState } from "react";
import { deepEqual } from "./Utils";

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
    console.log("backStack updated", backStack);
  }, [backStack]);

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  useEffect(() => {
    forwardStackRef.current = forwardStack;
    console.log("forwardStack updated", forwardStack);
  }, [forwardStack]);

  const push = (page) => {
    if (currentRef.current !== null && page !== currentRef.current) {
      setBackStack([...backStackRef.current, currentRef.current]);
      setForwardStack([]);
    }

    if (
      currentRef.current === null &&
      backStackRef.current.length > 0 &&
      deepEqual(page, backStackRef.current[backStackRef.current.length - 1])
    ) {
      console.log("found same object at top of backstack");
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
      //   console.log(`Went back to: ${previousPage}`);
    }
    // else {
    //   console.log("No pages in back history.");
    // }
  };

  const forward = () => {
    if (forwardStackRef.current.length > 0) {
      setBackStack([...backStackRef.current, currentRef.current]);
      const newForwardStack = [...forwardStackRef.current];
      const nextPage = newForwardStack.shift();
      setCurrent(nextPage);
      setForwardStack(newForwardStack);
      //   console.log(`Went forward to: ${nextPage}`);
    }
    // else {
    //   console.log("No pages in forward history.");
    // }
  };

  const clear = () => {
    setBackStack([]);
    setForwardStack([]);
    setCurrent(null);
    console.log("cleared stack");
  };

  const moveForwardToBack = () => {
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
