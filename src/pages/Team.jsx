import React, { useState } from "react";

const AddTeamMemberForm = ({ addTeamMember }) => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    addTeamMember({ name, role });
    setName("");
    setRole("");
  };

  return (
    <form onSubmit={handleSubmit} className="add-team-member-form">
      <h2>Add New Team Member</h2>
      <div className="form-grid">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
        <button type="submit" className="primary-button">
          Add Member
        </button>
      </div>
    </form>
  );
};

const Team = ({ teamMembers, addTeamMember }) => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Team Members</h1>
      <AddTeamMemberForm addTeamMember={addTeamMember} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map((member) => (
          <div key={member.id} className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold">{member.name}</h2>
            <p className="text-gray-500">{member.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Team;
