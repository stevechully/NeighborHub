import React, { useEffect, useState } from "react";
import { 
  fetchFacilities, 
  createFacility, 
  updateFacility, 
  deactivateFacility 
} from "../../api/facilities.api";

export default function AdminFacilities() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const initialForm = {
    name: "",
    description: "",
    capacity: "",
    open_time: "09:00",
    close_time: "18:00",
    slot_duration_minutes: 60,
    is_paid: false,
    fee: 0,
    approval_required: false
  };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadFacilities();
  }, []);

  async function loadFacilities() {
    try {
      setLoading(true);
      const data = await fetchFacilities();
      setFacilities(data || []);
    } catch (err) {
      alert("Failed to load facilities");
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (facility) => {
    setEditingId(facility.id);
    setForm({ ...facility });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateFacility(editingId, form);
        alert("Facility updated! ✅");
      } else {
        await createFacility(form);
        alert("Facility created! ✅");
      }
      setShowModal(false);
      loadFacilities();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleActive = async (facility) => {
    try {
      // If it's active, we deactivate it. 
      // If it's inactive, we use updateFacility to set is_active: true
      if (facility.is_active) {
        await deactivateFacility(facility.id);
      } else {
        await updateFacility(facility.id, { is_active: true });
      }
      loadFacilities();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ margin: 0 }}>Manage Facilities</h2>
        <button onClick={handleAddNew} style={styles.addBtn}>
          + Add Facility
        </button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div style={styles.grid}>
          {facilities.map((f) => (
            <div key={f.id} style={styles.card}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h3 style={{ margin: "0 0 8px 0" }}>{f.name}</h3>
                <span style={{ 
                  ...styles.statusBadge, 
                  backgroundColor: f.is_active ? "#dcfce7" : "#fee2e2",
                  color: f.is_active ? "#166534" : "#991b1b"
                }}>
                  {f.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              
              <p style={styles.desc}>{f.description}</p>
              
              <div style={styles.infoRow}>
                <span>🕒 {f.open_time} - {f.close_time}</span>
                <span>⏱️ {f.slot_duration_minutes}m slots</span>
              </div>

              <div style={styles.infoRow}>
                <span>💰 {f.is_paid ? `₹${f.fee}` : "Free"}</span>
                <span>👥 Cap: {f.capacity || "N/A"}</span>
              </div>

              <div style={styles.cardActions}>
                <button onClick={() => handleEdit(f)} style={styles.editBtn}>Edit</button>
                <button 
                  onClick={() => handleToggleActive(f)} 
                  style={f.is_active ? styles.deactivateBtn : styles.activateBtn}
                >
                  {f.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL UI --- */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <h3 style={{ marginTop: 0 }}>{editingId ? "Edit Facility" : "New Facility"}</h3>
            
            <div style={styles.formGroup}>
              <label>Name</label>
              <input style={styles.input} value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
            </div>

            <div style={styles.formGroup}>
              <label>Description</label>
              <textarea style={styles.input} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <div style={styles.formGroup}>
                <label>Open</label>
                <input type="time" style={styles.input} value={form.open_time} onChange={(e) => setForm({...form, open_time: e.target.value})} />
              </div>
              <div style={styles.formGroup}>
                <label>Close</label>
                <input type="time" style={styles.input} value={form.close_time} onChange={(e) => setForm({...form, close_time: e.target.value})} />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label>Slot Duration (minutes)</label>
              <input type="number" style={styles.input} value={form.slot_duration_minutes} onChange={(e) => setForm({...form, slot_duration_minutes: e.target.value})} />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input type="checkbox" checked={form.is_paid} onChange={(e) => setForm({...form, is_paid: e.target.checked})} />
                Paid Facility
              </label>
            </div>

            {form.is_paid && (
              <div style={styles.formGroup}>
                <label>Fee (₹)</label>
                <input type="number" style={styles.input} value={form.fee} onChange={(e) => setForm({...form, fee: e.target.value})} />
              </div>
            )}

            <div style={styles.modalFooter}>
              <button onClick={() => setShowModal(false)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleSave} style={styles.saveBtn}>Save Facility</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  statusBadge: { padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" },
  desc: { color: "#6b7280", fontSize: "14px", marginBottom: "16px", minHeight: "40px" },
  infoRow: { display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#374151", marginBottom: "8px" },
  cardActions: { display: "flex", gap: "10px", marginTop: "20px" },
  addBtn: { background: "#1e40af", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" },
  editBtn: { flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" },
  deactivateBtn: { flex: 1, padding: "8px", borderRadius: "6px", border: "none", background: "#fee2e2", color: "#991b1b", cursor: "pointer" },
  activateBtn: { flex: 1, padding: "8px", borderRadius: "6px", border: "none", background: "#dcfce7", color: "#166534", cursor: "pointer" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalBox: { background: "#fff", padding: "24px", borderRadius: "12px", width: "450px", maxHeight: "90vh", overflowY: "auto" },
  formGroup: { marginBottom: "16px", display: "flex", flexDirection: "column", gap: "4px" },
  input: { padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px" },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" },
  cancelBtn: { padding: "10px 16px", borderRadius: "8px", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" },
  saveBtn: { padding: "10px 16px", borderRadius: "8px", border: "none", background: "#1e40af", color: "#fff", fontWeight: "600", cursor: "pointer" },
};