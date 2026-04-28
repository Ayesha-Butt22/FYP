const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toString = (value, fallback = "") => {
  if (value == null) return fallback;
  return String(value).trim();
};

export function extractSupervisorList(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const candidates = [
    payload.supervisors,
    payload.users,
    payload.items,
    payload.result,
    payload.data,
    payload.data?.supervisors,
    payload.data?.users,
    payload.data?.items,
    payload.data?.result,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

export function parseSpecializations(specializationValue) {
  if (Array.isArray(specializationValue)) {
    return specializationValue
      .map((item) => toString(item))
      .filter(Boolean);
  }

  if (typeof specializationValue === "string") {
    return specializationValue
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function normalizeSupervisor(raw = {}) {
  const specialization = parseSpecializations(
    raw.specialization ??
      raw.speciality ??
      raw.Speciality ??
      raw.specializations ??
      raw.projectSpecialization
  );

  const availableSlots = toNumber(
    raw.availableSlots ??
      raw.available_slots ??
      raw.Available_Slots ??
      raw["Available Slots"] ??
      raw["Available_Slots"],
    0
  );

  const bookedSlots = toNumber(
    raw.bookedSlots ??
      raw.booked_slots ??
      raw.Booked_Slots ??
      raw["Booked Slots"] ??
      raw["Booked_Slots"],
    0
  );

  return {
    id: raw._id ?? raw.id ?? raw.ID ?? raw.userId ?? "",
    name: toString(raw.name ?? raw.Name, "N/A"),
    email: toString(raw.email ?? raw.Email, ""),
    department: toString(raw.department ?? raw.Department, ""),
    designation: toString(raw.designation ?? raw.Designation, ""),
    specialization,
    specializationText: specialization.join(", "),
    availableSlots,
    bookedSlots,
    raw,
  };
}

export function sortSupervisorsByName(supervisors = []) {
  return [...supervisors].sort((a, b) => {
    const byName = (a?.name || "").localeCompare(b?.name || "", undefined, {
      sensitivity: "base",
    });
    if (byName !== 0) return byName;
    return (a?.email || "").localeCompare(b?.email || "", undefined, {
      sensitivity: "base",
    });
  });
}

export function hasAvailableSlots(supervisor) {
  return toNumber(supervisor?.availableSlots, 0) > toNumber(supervisor?.bookedSlots, 0);
}

export function matchesAnySpecialization(supervisor, selectedSpecializations = []) {
  const selected = parseSpecializations(selectedSpecializations).map((item) =>
    item.toLowerCase()
  );
  if (!selected.length) return true;

  const supervisorSpecs = parseSpecializations(supervisor?.specialization).map((item) =>
    item.toLowerCase()
  );

  return supervisorSpecs.some((item) => selected.includes(item));
}
