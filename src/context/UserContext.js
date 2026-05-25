import { createContext, useContext } from 'react';

export const UserContext = createContext({ userType: null, authUid: null });
export const useUserContext = () => useContext(UserContext);
