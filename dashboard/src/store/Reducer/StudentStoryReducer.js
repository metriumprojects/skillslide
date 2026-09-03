import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";

export const getStudentStories = createAsyncThunk(
  "studentStory/get-all",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/student-stories", { withCredentials: true });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Something went wrong" }
      );
    }
  }
);

export const createStudentStory = createAsyncThunk(
  "studentStory/create",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post("/student-stories", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Something went wrong" }
      );
    }
  }
);

export const updateStudentStory = createAsyncThunk(
  "studentStory/update",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/student-stories/${id}`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Something went wrong" }
      );
    }
  }
);

export const deleteStudentStory = createAsyncThunk(
  "studentStory/delete",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/student-stories/${id}`, {
        withCredentials: true,
      });
      return { ...response.data, id };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Something went wrong" }
      );
    }
  }
);

const studentStorySlice = createSlice({
  name: "studentStory",
  initialState: {
    stories: [],
    loading: false,
    error: null,
    successMessage: "",
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getStudentStories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getStudentStories.fulfilled, (state, action) => {
        state.loading = false;
        state.stories = action.payload.stories || [];
      })
      .addCase(getStudentStories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createStudentStory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStudentStory.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.story) state.stories.unshift(action.payload.story);
        state.successMessage =
          action.payload.message || "Student story created successfully";
      })
      .addCase(createStudentStory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateStudentStory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStudentStory.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.story;
        if (updated) {
          const index = state.stories.findIndex((s) => s._id === updated._id);
          if (index !== -1) state.stories[index] = updated;
        }
        state.successMessage =
          action.payload.message || "Student story updated successfully";
      })
      .addCase(updateStudentStory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteStudentStory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStudentStory.fulfilled, (state, action) => {
        state.loading = false;
        state.stories = state.stories.filter((s) => s._id !== action.payload.id);
        state.successMessage =
          action.payload.message || "Student story deleted successfully";
      })
      .addCase(deleteStudentStory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSuccessMessage } = studentStorySlice.actions;
export default studentStorySlice.reducer;
