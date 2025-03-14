import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import axiosClient from "../axios-client.js";
import { useStateContext } from "../context/ContextProvider.jsx";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({});
  const [filterText, setFilterText] = useState("");
  const [loading, setLoading] = useState(false);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const { setNotification } = useStateContext();


  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    getUsers(currentPage);
  }, [currentPage, perPage]);

  const onDeleteClick = (user) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }
    axiosClient.delete(`/users/${user.id}`).then(() => {
      setNotification("User was successfully deleted");
      getUsers(currentPage);
    });
  };

  const getUsers = (page) => {
    setLoading(true);
    axiosClient
      .get("/users", {
        params: {
          page,
          per_page: perPage
        }
      })
      .then(({ data }) => {
        setLoading(false);
        setUsers(data.data);
        setMeta(data.meta);
        setCurrentPage(data.meta.current_page);
      })
      .catch(() => {
        setLoading(false);
        setUsers([]);
      });
  };

  const handlePerPageChange = (e) => {
    const newPerPage = parseInt(e.target.value);
    setPerPage(newPerPage);
    setCurrentPage(1); // Reset to first page
    getUsers(1); // Fetch first page with new per_page value
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const columns = [
    {
      name: "ID",
      selector: (row, index) => (currentPage - 1) * perPage + (index + 1),
      sortable: false,
      width: "70px",
    },
    { name: "Name", selector: (row) => row.name, sortable: true },
    { name: "Email", selector: (row) => row.email },
    { name: "Created Date", selector: (row) => row.created_at, sortable: true },
    {
      name: "Actions",
      cell: (row) => (
        <>
          <button className="btn-edit" onClick={() => openEditModal(row)}>
            Edit
          </button>
          &nbsp;
          <button className="btn-delete" onClick={() => onDeleteClick(row)}>
            Delete
          </button>
        </>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];


  const filteredUsers = users.filter(
    (user) =>
      (user.name &&
        user.name.toLowerCase().includes(filterText.toLowerCase())) ||
      (user.email &&
        user.email.toLowerCase().includes(filterText.toLowerCase()))
  );


  const CustomPagination = () => {
    return (
      <div className="pagination">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        {Array.from({ length: meta.last_page || 1 }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            className={currentPage === i + 1 ? "active" : ""}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() =>
            setCurrentPage((prev) =>
              prev < meta.last_page ? prev + 1 : meta.last_page
            )
          }
          disabled={currentPage === meta.last_page}
        >
          Next
        </button>
      </div>
    );
  };


  const handleEditUser = (userData) => {
    axiosClient.put(`/users/${selectedUser.id}`, userData).then(() => {
      setNotification("User was successfully updated");
      setShowEditModal(false);
      getUsers(currentPage);
    });
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h1>Users</h1>
      </div>
      <div className="card animated fadeInDown">
        <DataTable
          title="User List"
          columns={columns}
          data={filteredUsers}
          progressPending={loading}
          pagination
          paginationServer
          paginationTotalRows={meta.total || 0}
          paginationPerPage={perPage}
          paginationDefaultPage={currentPage}
          onChangePage={(page) => setCurrentPage(page)}
          paginationComponent={CustomPagination}
          highlightOnHover
          pointerOnHover
          subHeader
          subHeaderComponent={
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 0",
              }}
            >
              <div>
                <label>
                  Rows per page:{" "}
                  <select
                    value={perPage}
                    onChange={handlePerPageChange}
                    style={{
                      padding: "4px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  >
                    <option value="2">2</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </label>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  style={{
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                />
              </div>
            </div>
          }
        />
      </div>

      {/* Edit User Modal */}
      {showEditModal && (
        <Modal title="Edit User" onClose={() => setShowEditModal(false)}>
          <UserForm
            initialData={selectedUser}
            onSubmit={handleEditUser}
            onCancel={() => setShowEditModal(false)}
          />
        </Modal>
      )}
    </div>
  );
}


function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay" style={modalOverlayStyle}>
      <div className="modal-content" style={modalContentStyle}>
        <div className="modal-header" style={modalHeaderStyle}>
          <h2>{title}</h2>
          <button onClick={onClose} style={closeButtonStyle}>
            X
          </button>
        </div>
        <div className="modal-body" style={modalBodyStyle}>
          {children}
        </div>
      </div>
    </div>
  );
}


function UserForm({ initialData = { name: "", email: "" }, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(initialData);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const submitHandler = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={submitHandler}>
      <div style={{ marginBottom: "8px" }}>
        <label>Name: </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          style={{ padding: "4px", width: "100%" }}
        />
      </div>
      <div style={{ marginBottom: "8px" }}>
        <label>Email: </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          style={{ padding: "4px", width: "100%" }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="button" onClick={onCancel} style={{ marginRight: "8px" }}>
          Cancel
        </button>
        <button type="submit">Submit</button>
      </div>
    </form>
  );
}


const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalContentStyle = {
  background: "#fff",
  padding: "16px",
  borderRadius: "4px",
  width: "400px",
  maxWidth: "90%",
};

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px",
};

const closeButtonStyle = {
  background: "transparent",
  border: "none",
  fontSize: "16px",
  cursor: "pointer",
};

const modalBodyStyle = {
  maxHeight: "70vh",
  overflowY: "auto",
};
