import { request } from "./client";

function fetchSubjects() {
  return request("/subjects");
}

function createSubject(name) {
  return request("/subjects", {
    method: "POST",
    body: JSON.stringify({ name })
  });
}

function deleteSubject(subjectId) {
  return request(`/subjects/${subjectId}`, {
    method: "DELETE"
  });
}

export { createSubject, deleteSubject, fetchSubjects };
