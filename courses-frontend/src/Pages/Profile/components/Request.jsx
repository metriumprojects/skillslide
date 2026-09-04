import { Heart, Edit, Trash, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deletePropose, getProposeByUser } from "../../../redux/reducers/ProposeReducer";
import UpdateRequest from "../Request/UpdateRequest";
import { toast } from "react-toastify";
import ProfileRequestCard from "./ProfileRequestCard";
import CreateRequestPopup from "../../Home/Components/CreateRequestPopup";

export default function Request() {
  const dispatch = useDispatch();
  const { userProposes } = useSelector((state) => state.propose);
  const [edit, setEdit] = useState(false);
  const [id, setId] = useState(null);
  const [showCreateRequest, setShowCreateRequest] = useState(false);

  useEffect(() => {
    dispatch(getProposeByUser());
  }, [dispatch]);

  const handleedit = (id) => {
    setEdit(true);
    setId(id);
  };

const handleDelete = (id) => {
  toast.info(
    <div>
      <p className="font-medium">Are you sure you want to delete?</p>
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => {
            dispatch(deletePropose(id)).then((res) => {
              if (res.payload.status) {
                toast.success("Request deleted successfully");
                dispatch(getProposeByUser());
              } else {
                toast.error(res.payload?.message || "Failed to delete request");
              }
            });
            toast.dismiss();
          }}
          className="bg-red-500 text-white px-3 py-1 rounded"
        >
          Yes
        </button>

        <button
          onClick={() => toast.dismiss()}
          className="bg-gray-300 px-3 py-1 rounded"
        >
          No
        </button>
      </div>
    </div>,
    { autoClose: false }
  );
};

  return (
    <div className="w-full pb-10 space-y-6">
      <div className="flex items-center justify-start mt-[20px] mb-[20px]">
        <button 
          type="button"
          onClick={() => setShowCreateRequest(true)}
          className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors shadow-sm"
        >
          <Plus size={16} strokeWidth={2.5} />
          Post a request
        </button>
      </div>
      {userProposes && userProposes.length > 0 ? (
        userProposes.map((req) => (
          <ProfileRequestCard
            key={req._id}
            req={req}
            onEdit={handleedit}
            onDelete={handleDelete}
          />
        ))
      ) : (
        <div className="w-full bg-[#F5F5F5] p-3 md:p-10 rounded-3xl">
          <p>No requests found</p>
        </div>
      )}

      {edit && (
        <UpdateRequest id={id} open={edit} onClose={() => setEdit(false)} />
      )}

      <CreateRequestPopup
        open={showCreateRequest}
        onClose={() => setShowCreateRequest(false)}
      />
    </div>
  );
}
