
document.addEventListener("DOMContentLoaded", () => {

    // =====================================
    // CONFIGURATION
    // =====================================

    const API_URL = "http://localhost:5000/api";
    const token = sessionStorage.getItem("libraryToken");

    if (!token) {
        window.location.href = "admin-login.html";
        return;
    }

    // =====================================
    // ELEMENTS
    // =====================================

    const seatGrid = document.getElementById("seatGrid");

    const totalSeats = document.getElementById("totalSeats");
    const availableSeats = document.getElementById("availableSeats");
    const confirmedSeats = document.getElementById("confirmedSeats");
    const totalStudents = document.getElementById("totalStudents");

    const currentDate = document.getElementById("currentDate");

    const logoutBtn = document.getElementById("logoutBtn");

    const searchInput = document.getElementById("studentSearch");
    const searchBtn = document.getElementById("searchBtn");

    const requestTableBody = document.getElementById("requestTableBody");
    const studentTableBody = document.getElementById("studentTableBody");

    // =====================================
    // CURRENT DATE
    // =====================================

    if (currentDate) {
        currentDate.textContent = new Date().toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
    }

    // =====================================
    // API HELPER
    // =====================================

    async function apiRequest(endpoint, options = {}) {

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                ...(options.headers || {})
            }
        });

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error("Server returned an invalid response.");
        }

        if (response.status === 401) {
            sessionStorage.removeItem("libraryToken");
            alert("Login session expired. Please login again.");
            window.location.href = "admin-login.html";
            throw new Error("Authentication required.");
        }

        if (!response.ok || !data.success) {
            throw new Error(data.message || "API request failed.");
        }

        return data;
    }

    // =====================================
    // EMPTY TABLE MESSAGE
    // =====================================

    function showEmptyRow(tableBody, message, colspan) {

        if (!tableBody) return;

        tableBody.innerHTML = "";

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = colspan;
        cell.className = "empty-message";
        cell.textContent = message;

        row.appendChild(cell);
        tableBody.appendChild(row);
    }

    // =====================================
    // CREATE TABLE CELL
    // =====================================

    function createCell(value) {

        const cell = document.createElement("td");
        cell.textContent = value ?? "—";

        return cell;
    }

    // =====================================
    // STATUS BADGE
    // =====================================

    function createStatusBadge(status) {

        const badge = document.createElement("span");

        badge.className = `status-badge ${String(status)
            .toLowerCase()}`;

        badge.textContent = status;

        return badge;
    }

    // =====================================
    // LOAD SEATS FROM MONGODB
    // =====================================

    function renderSeats(seats) {

        if (!seatGrid) return;

        seatGrid.innerHTML = "";

        if (!seats.length) {
            seatGrid.textContent = "No seats found.";
            return;
        }

        seats.forEach((seat) => {

            const seatElement = document.createElement("div");

            seatElement.className =
                `seat-item ${seat.status.toLowerCase()}`;

            const seatName = document.createElement("span");
            seatName.textContent = seat.seatNumber;

            const seatStatus = document.createElement("small");
            seatStatus.textContent = seat.status;

            seatElement.appendChild(seatName);
            seatElement.appendChild(seatStatus);

            seatGrid.appendChild(seatElement);

        });
    }

    // =====================================
    // UPDATE DASHBOARD STATISTICS
    // =====================================

    function updateStatistics(seats, students) {

        const availableCount = seats.filter(
            seat => seat.status === "Available"
        ).length;

        const confirmedCount = seats.filter(
            seat => seat.status === "Confirmed"
        ).length;

        if (totalSeats) {
            totalSeats.textContent = seats.length;
        }

        if (availableSeats) {
            availableSeats.textContent = availableCount;
        }

        if (confirmedSeats) {
            confirmedSeats.textContent = confirmedCount;
        }

        if (totalStudents) {
            totalStudents.textContent = students.length;
        }
    }

    // =====================================
    // RENDER PENDING REQUESTS
    // =====================================

    function renderRequests(requests) {

        if (!requestTableBody) return;

        requestTableBody.innerHTML = "";

        if (!requests.length) {
            showEmptyRow(
                requestTableBody,
                "No pending registration requests.",
                5
            );
            return;
        }

        requests.forEach((student) => {

            const row = document.createElement("tr");

            const seatNumber =
                student.requestedSeat?.seatNumber || "Seat unavailable";

            row.appendChild(createCell(student.fullName));
            row.appendChild(createCell(student.mobile));
            row.appendChild(createCell(student.course));
            row.appendChild(createCell(seatNumber));

            const actionCell = document.createElement("td");

            const approveBtn = document.createElement("button");

            approveBtn.type = "button";
            approveBtn.className = "action-btn confirm-btn";
            approveBtn.textContent = "Approve";
            approveBtn.dataset.action = "approve";
            approveBtn.dataset.id = student._id;

            const rejectBtn = document.createElement("button");

            rejectBtn.type = "button";
            rejectBtn.className = "action-btn delete-btn";
            rejectBtn.textContent = "Reject";
            rejectBtn.dataset.action = "reject";
            rejectBtn.dataset.id = student._id;

            actionCell.appendChild(approveBtn);
            actionCell.appendChild(rejectBtn);

            row.appendChild(actionCell);

            requestTableBody.appendChild(row);

        });
    }

    // =====================================
    // RENDER ALL STUDENTS
    // =====================================

    function renderStudents(students) {

        if (!studentTableBody) return;

        studentTableBody.innerHTML = "";

        if (!students.length) {
            showEmptyRow(
                studentTableBody,
                "No student records found.",
                7
            );
            return;
        }

        students.forEach((student) => {

            const row = document.createElement("tr");

            const seat = student.requestedSeat;

            const seatNumber = seat?.seatNumber || "—";

            const seatStatus =
                seat?.status ||
                (student.isConfirmed ? "Confirmed" : "Pending");

            const requestStatus =
                student.status ||
                (student.isConfirmed ? "Confirmed" : "Pending");

            row.appendChild(createCell(student.fullName));
            row.appendChild(createCell(student.mobile));
            row.appendChild(createCell(student.course));
            row.appendChild(createCell(student.guardianName));
            row.appendChild(createCell(seatNumber));

            const statusCell = document.createElement("td");

            const badge = createStatusBadge(seatStatus);

            badge.title = `Registration: ${requestStatus}`;

            statusCell.appendChild(badge);
            row.appendChild(statusCell);

            const actionCell = document.createElement("td");

            actionCell.textContent =
                requestStatus === "Pending"
                    ? "Awaiting approval"
                    : requestStatus;

            row.appendChild(actionCell);

            studentTableBody.appendChild(row);

        });
    }

    // =====================================
    // LOAD ALL DASHBOARD DATA
    // =====================================

    async function loadDashboard() {

        try {

            if (seatGrid) {
                seatGrid.innerHTML =
                    '<p class="loading-text">Loading seats...</p>';
            }

            const [seatData, studentData, requestData] =
                await Promise.all([

                    apiRequest("/seats"),

                    apiRequest("/admin/students"),

                    apiRequest("/admin/requests")

                ]);

            renderSeats(seatData.seats);

            renderRequests(requestData.requests);

            renderStudents(studentData.students);

            updateStatistics(
                seatData.seats,
                studentData.students
            );

            console.log("Dashboard Data Loaded Successfully!");

            console.log("Total Seats:", seatData.totalSeats);

            console.log("Total Students:", studentData.totalStudents);

            console.log("Pending Requests:", requestData.totalRequests);

        } catch (error) {

            console.error("Dashboard Error:", error.message);

            if (seatGrid) {
                seatGrid.textContent = error.message;
            }

            showEmptyRow(
                requestTableBody,
                "Unable to load registration requests.",
                5
            );

            showEmptyRow(
                studentTableBody,
                "Unable to load student records.",
                7
            );
        }
    }

    // =====================================
    // APPROVE / REJECT STUDENT REQUESTS
    // =====================================

    if (requestTableBody) {

        requestTableBody.addEventListener("click", async (event) => {

            const button = event.target.closest("button[data-action]");

            if (!button) return;

            const studentId = button.dataset.id;
            const action = button.dataset.action;

            const actionName =
                action === "approve" ? "approve" : "reject";

            const confirmed = window.confirm(
                `Are you sure you want to ${actionName} this student?`
            );

            if (!confirmed) return;

            button.disabled = true;

            try {

                const result = await apiRequest(
                    `/admin/students/${studentId}/${action}`,
                    {
                        method: "PATCH"
                    }
                );

                alert(result.message);

                // Refresh seats, requests and students
                await loadDashboard();

            } catch (error) {

                alert(error.message);

                button.disabled = false;

            }

        });

    }

    // =====================================
    // STUDENT SEARCH
    // =====================================

    function searchStudents() {

        if (!studentTableBody || !searchInput) return;

        const searchValue =
            searchInput.value.toLowerCase().trim();

        const rows = studentTableBody.querySelectorAll("tr");

        rows.forEach((row) => {

            const rowText = row.textContent.toLowerCase();

            row.style.display =
                rowText.includes(searchValue) ? "" : "none";

        });
    }

    if (searchBtn) {
        searchBtn.addEventListener("click", searchStudents);
    }

    if (searchInput) {
        searchInput.addEventListener("input", searchStudents);
    }

    // =====================================
    // SIDEBAR ACTIVE MENU
    // =====================================

    const menuLinks = document.querySelectorAll(".menu-link");

    menuLinks.forEach((link) => {

        link.addEventListener("click", () => {

            menuLinks.forEach((item) => {
                item.classList.remove("active");
            });

            link.classList.add("active");

        });

    });

    // =====================================
    // OWNER LOGOUT
    // =====================================

    if (logoutBtn) {

        logoutBtn.addEventListener("click", () => {

            const confirmLogout = window.confirm(
                "Are you sure you want to logout?"
            );

            if (confirmLogout) {

                sessionStorage.removeItem("libraryToken");

                window.location.href = "admin-login.html";

            }

        });

    }

    // =====================================
    // INITIALIZE DASHBOARD
    // =====================================

    loadDashboard();

});
