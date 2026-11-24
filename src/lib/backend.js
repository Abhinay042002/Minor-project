import * as supabase from "./supabase.js";

export const backendEnabled = supabase.backendConfigured;

export const backend = {
  signIn: supabase.signIn,
  signUp: supabase.signUp,
  signOut: supabase.signOut,
  getCurrentProfile: supabase.getCurrentProfile,
  fetchProducts: supabase.fetchProducts,
  fetchOrders: supabase.fetchOrders,
  fetchWishlist: supabase.fetchWishlist,
  saveWishlist: supabase.saveWishlist,
  removeWishlist: supabase.removeWishlist,
  createReview: supabase.createReview,
  createOrder: supabase.createOrder,
  createProduct: supabase.createProduct,
  updateOrderStatus: supabase.updateOrderStatus
};
