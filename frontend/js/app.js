
document.addEventListener("DOMContentLoaded", () => {

    const bookingForm = document.getElementById("bookingForm");
    const seatSelect = document.getElementById("seatNumber");
    const formMessage = document.getElementById("formMessage");
    const submitBtn = bookingForm.querySelector(".submit-btn");
    const joiningDate = document.getElementById("joiningDate");

    const API_URL = "http://localhost:5000/api";

    // Today's date
    const today = new Date().toLocaleDateString("en-CA");

    joiningDate.min = today;
    joiningDate.value = today;

    // Show messages
    function showMessage(message, success = false) {
        formMessage.textContent = message;
        formMessage.style.color = success ? "#16a34a" : "#dc2626";
    }

    // =================================
    // LOAD AVAILABLE SEATS FROM DATABASE
    // =================================

    async function loadAvailableSeats() {

        seatSelect.innerHTML = '<option value="">Loading seats...</option>';

        try {

            const response = await fetch(`${API_URL}/seats/available`);

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to load seats.");
            }

            seatSelect.innerHTML = '<option value="">Select an available seat</option>';

            if (data.seats.length === 0) {

                seatSelect.innerHTML =
                    '<option value="">No seats available</option>';

                return;
            }

            data.seats.forEach((seat) => {

                const option = document.createElement("option");

                option.value = seat.seatNumber;
                option.textContent = `${seat.seatNumber} - Available`;

                seatSelect.appendChild(option);

            });

            console.log("Available seats loaded:", data.totalAvailable);

        } catch (error) {

            seatSelect.innerHTML =
                '<option value="">Unable to load seats</option>';

            showMessage("Seat loading error: " + error.message);

            console.error(error);

        }
    }

    // =================================
    // STUDENT REGISTRATION
    // =================================

    bookingForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        if (!document.getElementById("terms").checked) {
            showMessage("Please accept the confirmation checkbox.");
            return;
        }

        const studentData = {

            fullName: document.getElementById("studentName").value.trim(),

            mobile: document.getElementById("mobile").value.trim(),

            email: document.getElementById("email").value.trim(),

            course: document.getElementById("course").value.trim(),

            guardianName: document.getElementById("guardian").value.trim(),

            joiningDate: joiningDate.value,

            address: document.getElementById("address").value.trim(),

            seatNumber: seatSelect.value

        };

        if (!studentData.seatNumber) {
            showMessage("Please select an available seat.");
            return;
        }

        try {

            submitBtn.disabled = true;
            submitBtn.textContent = "Submitting...";
            showMessage("");

            const response = await fetch(`${API_URL}/students/register`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(studentData)

            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Registration failed.");
            }

            showMessage(data.message, true);

            bookingForm.reset();

            joiningDate.value = today;

            // Refresh seat list
            await loadAvailableSeats();

            console.log("Student Registration:", data);

        } catch (error) {

            showMessage(error.message);

        } finally {

            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Seat Request →";

        }

    });

    // Load seats when page opens
    loadAvailableSeats();

});
