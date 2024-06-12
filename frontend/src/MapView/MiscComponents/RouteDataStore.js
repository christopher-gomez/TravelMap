import React, { createContext, useContext, useReducer } from 'react';

// Create a context for the routeDataStore
const RouteDataStoreContext = createContext();

// Custom hook to use the routeDataStore context
export function useRouteDataStore() {
  return useContext(RouteDataStoreContext);
}

// Initial state
const initialState = {
  // Define your initial state here
  data: [],
};

// Reducer function to manage state updates
function reducer(state, action) {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, data: action.payload };
    case 'CLEAR_DATA':
      return { ...state, data: null };
    default:
      return state;
  }
}

// RouteDataStoreProvider component to provide the state and dispatch to its children
export function RouteDataStoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setData = (data) => {
    dispatch({ type: 'SET_DATA', payload: data });
  };

  const clearData = () => {
    dispatch({ type: 'CLEAR_DATA' });
  };

  return (
    <RouteDataStoreContext.Provider value={{ state, setData, clearData }}>
      {children}
    </RouteDataStoreContext.Provider>
  );
}
