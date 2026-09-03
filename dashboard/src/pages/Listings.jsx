import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchListings, deleteListing, updateListing } from '../store/Reducer/ListingsReducer';
import { useNavigate } from 'react-router-dom';

export default function Listings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { listings, loading, error } = useSelector((state) => state.listings);

  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchListings());
  }, [dispatch]);

  const handleDelete = (id) => {
    if (!window.confirm('Delete this listing? This action cannot be undone.')) return;
    dispatch(deleteListing(id));
  };

  const startEdit = (listing) => setEditing({ id: listing._id, title: listing.title || '', price: listing.price || 0 });

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    await dispatch(updateListing({ id: editing.id, data: { title: editing.title, price: editing.price } }));
    setEditing(null);
    setSaving(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Listings</h1>
        <button onClick={() => navigate('/create-listing')} className="px-4 py-2 bg-black text-white rounded">New Listing</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : !Array.isArray(listings) || listings.length === 0 ? (
        <p>No listings found.</p>
      ) : (
        <div className="overflow-x-auto bg-white border rounded">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="text-left">
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Created By</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map(listing => (
                <tr key={listing._id} className="border-t">
                  <td className="px-4 py-2">{listing.title}</td>
                  <td className="px-4 py-2">{listing.createdBy?.name || listing.createdBy || '—'}</td>
                  <td className="px-4 py-2">${listing.price ?? '—'}</td>
                  <td className="px-4 py-2">{listing.isActive ? 'Active' : 'Inactive'}</td>
                  <td className="px-4 py-2 flex gap-2">
                    {/* <button onClick={() => startEdit(listing)} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Edit</button> */}
                    <button onClick={() => handleDelete(listing._id)} className="px-2 py-1 bg-red-600 text-white rounded">Delete</button>
                    <a href={`https://skillslide.com/listing/${listing.slug || listing._id}`} target="_blank" rel="noreferrer" className="px-2 py-1 bg-gray-100 rounded">View</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-xl">
            <h3 className="text-lg font-medium mb-4">Edit Listing</h3>
            <label className="block text-sm mb-1">Title</label>
            <input value={editing.title} onChange={e => setEditing(prev => ({ ...prev, title: e.target.value }))} className="w-full mb-3 px-3 py-2 border rounded" />
            <label className="block text-sm mb-1">Price</label>
            <input type="number" value={editing.price} onChange={e => setEditing(prev => ({ ...prev, price: e.target.value }))} className="w-full mb-4 px-3 py-2 border rounded" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-black text-white rounded">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}