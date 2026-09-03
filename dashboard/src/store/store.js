import { configureStore } from "@reduxjs/toolkit";
import AuthReducer from "./Reducer/AuthReducer";
import DashboardReducer from "./Reducer/DashboardReducer";
import WithdrawalReducer from "./Reducer/WithdrawReducer";
import CategoryReducer from "./Reducer/CategoryReducer";
import ListingsReducer from "./Reducer/ListingsReducer";
import StudentStoryReducer from "./Reducer/StudentStoryReducer";

export const store = configureStore({
  reducer: {
    auth: AuthReducer,
    dashboard: DashboardReducer,
    withdrawal: WithdrawalReducer,
    category: CategoryReducer,
    listings: ListingsReducer,
    studentStory: StudentStoryReducer,
  },
});
