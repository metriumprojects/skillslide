import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";

export const fetchListings = createAsyncThunk(
  "listings/fetchListings",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/listings", {
        withCredentials: true,
      });
      // backend returns { status, page, limit, total, listings }
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteListing = createAsyncThunk(
  "listings/deleteListing",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/listings/${id}`, {
        withCredentials: true,
      });
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateListing = createAsyncThunk(
  "listings/updateListing",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/listings/${id}`, data, {
        withCredentials: true,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const ListingsSlice = createSlice({
  name: "listings",
  initialState: { listings: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchListings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchListings.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(action.payload)) {
          state.listings = action.payload;
        } else if (action.payload && Array.isArray(action.payload.listings)) {
          state.listings = action.payload.listings;
        } else {
          state.listings = [];
        }
      })
      .addCase(fetchListings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      .addCase(deleteListing.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteListing.fulfilled, (state, action) => {
        state.listings = state.listings.filter((l) => l._id !== action.payload);
      })
      .addCase(deleteListing.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })

      .addCase(updateListing.pending, (state) => {
        state.error = null;
      })
      .addCase(updateListing.fulfilled, (state, action) => {
        const updated = action.payload && action.payload.listing ? action.payload.listing : action.payload;
        state.listings = state.listings.map((l) => (l._id === (updated._id || updated.id) ? updated : l));
      })
      .addCase(updateListing.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      });
  },
});

export default ListingsSlice.reducer;
