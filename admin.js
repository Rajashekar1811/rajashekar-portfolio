
document.addEventListener("DOMContentLoaded", () => {
  // =====================================
  // SUPABASE CLIENT
  // =====================================

  const db = window.supabaseClient || window.supabase?.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_PUBLISHABLE_KEY
  );

  if (!db) {
    alert("Supabase connection not found. Check supabase-config.js");
    return;
  }

  // =====================================
  // AUTH ELEMENTS
  // =====================================

  const loginScreen = document.getElementById("loginScreen");
  const forgotScreen = document.getElementById("forgotScreen");
  const resetScreen = document.getElementById("resetScreen");
  const dashboard = document.getElementById("adminDashboard");

  const loginForm = document.getElementById("adminLoginForm");
  const forgotForm = document.getElementById("forgotPasswordForm");
  const resetForm = document.getElementById("resetPasswordForm");

  const loginMessage = document.getElementById("loginMessage");
  const forgotMessage = document.getElementById("forgotMessage");
  const resetMessage = document.getElementById("resetMessage");

  let activeUserId = null;
  let editingProject = null;
  let editingSkill = null;
  let editingEducation = null;
  let editingCert = null;
  let education = [];

  let projects = [];
  let skills = [];
  let certifications = [];
  let messages = [];

  function showScreen(screen) {
    loginScreen.hidden = screen !== "login";
    forgotScreen.hidden = screen !== "forgot";
    resetScreen.hidden = screen !== "reset";
    dashboard.hidden = screen !== "dashboard";
  }

  function showMessage(element, message, success = false) {
    element.textContent = message;
    element.style.color = success ? "#4ade80" : "#fbbf24";
  }

  // =====================================
  // OWNER VERIFICATION
  // =====================================

  async function verifyOwner(user) {
    if (!user) {
      activeUserId = null;
      showScreen("login");
      return false;
    }

    const { data, error } = await db.rpc("is_portfolio_admin");

    if (error || data !== true) {
      await db.auth.signOut();
      activeUserId = null;
      showScreen("login");
      showMessage(
        loginMessage,
        "This account is not authorized as Portfolio Owner."
      );
      return false;
    }

    activeUserId = user.id;
    showScreen("dashboard");

    await loadAllData();
    return true;
  }

  // =====================================
  // LOGIN
  // =====================================

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const button = document.getElementById("loginBtn");

    button.disabled = true;
    button.textContent = "Signing in...";
    showMessage(loginMessage, "");

    const { error } = await db.auth.signInWithPassword({
      email,
      password
    });

    button.disabled = false;
    button.innerHTML =
      '<i class="fa-solid fa-right-to-bracket"></i> Login';

    if (error) {
      showMessage(loginMessage, error.message);
    }
  });

  // =====================================
  // FORGOT PASSWORD
  // =====================================

  document.getElementById("forgotPasswordBtn")
    .addEventListener("click", () => {
      document.getElementById("forgotEmail").value =
        document.getElementById("loginEmail").value.trim();

      showMessage(forgotMessage, "");
      showScreen("forgot");
    });

  document.getElementById("backToLoginBtn")
    .addEventListener("click", () => {
      showScreen("login");
    });

  forgotForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("forgotEmail").value.trim();
    const button = document.getElementById("sendResetBtn");

    button.disabled = true;
    button.textContent = "Sending...";

    const redirectUrl =
      window.location.origin + window.location.pathname;

    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    button.disabled = false;
    button.innerHTML =
      '<i class="fa-solid fa-paper-plane"></i> Send Reset Link';

    if (error) {
      showMessage(forgotMessage, error.message);
    } else {
      showMessage(
        forgotMessage,
        "If the account exists, a password reset email has been sent. Check your inbox.",
        true
      );
    }
  });

  // =====================================
  // RESET PASSWORD
  // =====================================

  resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const password = document.getElementById("newPassword").value;
    const confirmPassword =
      document.getElementById("confirmPassword").value;

    const button = document.getElementById("updatePasswordBtn");

    if (password.length < 8) {
      showMessage(resetMessage, "Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      showMessage(resetMessage, "Passwords do not match.");
      return;
    }

    button.disabled = true;
    button.textContent = "Updating...";

    const { error } = await db.auth.updateUser({
      password
    });

    button.disabled = false;
    button.innerHTML =
      '<i class="fa-solid fa-check"></i> Update Password';

    if (error) {
      showMessage(resetMessage, error.message);
    } else {
      showMessage(
        resetMessage,
        "Password updated successfully. Please login again.",
        true
      );

      await db.auth.signOut();
      resetForm.reset();
      showScreen("login");
      showMessage(loginMessage, "Your password has been updated. Login with your new password.", true);
    }
  });

  // =====================================
  // LOGOUT
  // =====================================

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    const { error } = await db.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    activeUserId = null;
    showScreen("login");
    loginForm.reset();
    showMessage(loginMessage, "You have been logged out.", true);
  });

  // =====================================
  // COMMON ITEM CARD
  // =====================================

  function createItem(title, description, onEdit, onDelete) {
    const card = document.createElement("div");
    card.className = "item-card";

    const details = document.createElement("div");
    details.className = "item-details";

    const heading = document.createElement("h3");
    heading.textContent = title || "";

    const paragraph = document.createElement("p");
    paragraph.textContent = description || "";

    details.append(heading, paragraph);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    if (onEdit) {
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "edit-btn";
      editButton.innerHTML = '<i class="fa-solid fa-pen"></i> Edit';
      editButton.addEventListener("click", onEdit);
      actions.appendChild(editButton);
    }

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i> Delete';
    deleteButton.addEventListener("click", onDelete);

    actions.appendChild(deleteButton);
    card.append(details, actions);

    return card;
  }

// =====================================
// PROFILE PICTURE MANAGEMENT
// WITH ZOOM, CROP AND DRAG
// =====================================

const PROFILE_BUCKET = "portfolio-assets";
const PROFILE_IMAGE_PATH = "profile/profile.jpg";

const profileImageInput =
  document.getElementById("profileImageInput");

const profileImageForm =
  document.getElementById("profileImageForm");

const profileImagePreview =
  document.getElementById("profileImagePreview");

const currentProfileImage =
  document.getElementById("currentProfileImage");

const profileEditor =
  document.getElementById("profileEditor");

const profileImageUploadBtn =
  document.getElementById("profileImageUploadBtn");

const profileImageDeleteBtn =
  document.getElementById("profileImageDeleteBtn");

const profileImageStatus =
  document.getElementById("profileImageStatus");

const profileZoomIn =
  document.getElementById("profileZoomIn");

const profileZoomOut =
  document.getElementById("profileZoomOut");

const profileCropReset =
  document.getElementById("profileCropReset");

let profileCropper = null;
let selectedProfileFile = null;
let profileObjectURL = null;


// STATUS MESSAGE
function showProfileStatus(message, success = false) {
  if (!profileImageStatus) return;

  profileImageStatus.textContent = message;
  profileImageStatus.style.color =
    success ? "#16a34a" : "#dc2626";
}


// LOAD CURRENT PROFILE IMAGE
async function loadProfileImage() {
  if (!currentProfileImage) return;

  const { data } = db.storage
    .from(PROFILE_BUCKET)
    .getPublicUrl(PROFILE_IMAGE_PATH);

  currentProfileImage.onload = () => {
    currentProfileImage.hidden = false;
  };

  currentProfileImage.onerror = () => {
    currentProfileImage.hidden = true;
  };

  currentProfileImage.src =
    data.publicUrl + "?t=" + Date.now();
}


// CLEAN UP EDITOR
function destroyProfileCropper() {
  if (profileCropper) {
    profileCropper.destroy();
    profileCropper = null;
  }

  if (profileObjectURL) {
    URL.revokeObjectURL(profileObjectURL);
    profileObjectURL = null;
  }
}


// SELECT IMAGE
if (profileImageInput) {
  profileImageInput.addEventListener("change", () => {

    const file = profileImageInput.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Please select JPG, PNG or WEBP image.");
      profileImageInput.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be below 5 MB.");
      profileImageInput.value = "";
      return;
    }

    if (typeof Cropper === "undefined") {
      alert("Image editor library could not load. Check your internet connection.");
      return;
    }

    destroyProfileCropper();

    selectedProfileFile = file;
    profileObjectURL = URL.createObjectURL(file);

    profileEditor.hidden = false;

    profileImagePreview.onload = () => {

      profileCropper = new Cropper(profileImagePreview, {
        aspectRatio: 1,
        viewMode: 1,
        dragMode: "move",
        autoCropArea: 1,
        responsive: true,
        background: false,
        guides: true,
        center: true,
        movable: true,
        zoomable: true,
        zoomOnWheel: true,
        cropBoxMovable: false,
        cropBoxResizable: false,
        toggleDragModeOnDblclick: false
      });

    };

    profileImagePreview.src = profileObjectURL;

    showProfileStatus(
      "Adjust the image and save when ready.",
      true
    );
  });
}


// ZOOM IN
profileZoomIn?.addEventListener("click", () => {
  if (profileCropper) {
    profileCropper.zoom(0.1);
  }
});


// ZOOM OUT
profileZoomOut?.addEventListener("click", () => {
  if (profileCropper) {
    profileCropper.zoom(-0.1);
  }
});


// RESET CROP
profileCropReset?.addEventListener("click", () => {
  if (profileCropper) {
    profileCropper.reset();
  }
});


// UPLOAD CROPPED IMAGE
if (profileImageForm) {

  profileImageForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    if (!profileCropper || !selectedProfileFile) {
      alert("Please select a profile picture and adjust it first.");
      return;
    }

    profileImageUploadBtn.disabled = true;

    showProfileStatus("Preparing your cropped image...");

    try {

      const canvas = profileCropper.getCroppedCanvas({
        width: 800,
        height: 800,
        minWidth: 300,
        minHeight: 300,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high"
      });

      if (!canvas) {
        throw new Error("Unable to crop the selected image.");
      }

      const croppedBlob = await new Promise((resolve, reject) => {

        canvas.toBlob((blob) => {

          if (!blob) {
            reject(new Error("Image processing failed."));
            return;
          }

          resolve(blob);

        }, "image/jpeg", 0.92);

      });


      const { error } = await db.storage
        .from(PROFILE_BUCKET)
        .upload(PROFILE_IMAGE_PATH, croppedBlob, {
          upsert: true,
          contentType: "image/jpeg",
          cacheControl: "0"
        });

      if (error) throw error;

      destroyProfileCropper();

      selectedProfileFile = null;
      profileImageInput.value = "";
      profileEditor.hidden = true;

      await loadProfileImage();

      showProfileStatus(
        "Profile picture saved successfully!",
        true
      );

      alert("Profile picture uploaded successfully!");

    } catch (error) {

      console.error("Profile upload error:", error);

      showProfileStatus(
        "Upload failed: " + error.message
      );

      alert("Profile upload failed: " + error.message);

    } finally {

      profileImageUploadBtn.disabled = false;

    }

  });

}


// DELETE PROFILE IMAGE
if (profileImageDeleteBtn) {

  profileImageDeleteBtn.addEventListener("click", async () => {

    if (!confirm("Are you sure you want to delete your profile picture?")) {
      return;
    }

    profileImageDeleteBtn.disabled = true;

    try {

      const { error } = await db.storage
        .from(PROFILE_BUCKET)
        .remove([PROFILE_IMAGE_PATH]);

      if (error) throw error;

      destroyProfileCropper();

      selectedProfileFile = null;
      profileImageInput.value = "";
      profileEditor.hidden = true;

      currentProfileImage.removeAttribute("src");
      currentProfileImage.hidden = true;

      showProfileStatus(
        "Profile picture deleted successfully.",
        true
      );

      alert("Profile picture deleted successfully!");

    } catch (error) {

      console.error("Profile delete error:", error);

      showProfileStatus(
        "Delete failed: " + error.message
      );

      alert("Profile delete failed: " + error.message);

    } finally {

      profileImageDeleteBtn.disabled = false;

    }

  });

}

        
// =====================================
// RESUME MANAGEMENT
// =====================================

const RESUME_BUCKET = "portfolio-assets";
const RESUME_FILE_PATH = "resume/resume.pdf";
const MAX_RESUME_SIZE = 10 * 1024 * 1024;

const resumeForm = document.getElementById("resumeForm");
const resumeInput = document.getElementById("resumeInput");
const resumeUploadBtn = document.getElementById("resumeUploadBtn");
const resumeStatus = document.getElementById("resumeStatus");
const currentResumeName = document.getElementById("currentResumeName");
const resumePreviewContainer = document.getElementById("resumePreviewContainer");
const resumePreview = document.getElementById("resumePreview");
const resumeReplaceBtn = document.getElementById("resumeReplaceBtn");
const resumeDeleteBtn = document.getElementById("resumeDeleteBtn");

function showResumeStatus(message, success = false) {
  if (!resumeStatus) return;

  resumeStatus.textContent = message;
  resumeStatus.style.color = success ? "#16a34a" : "#dc2626";
}


// LOAD CURRENT RESUME
async function loadResume() {
  if (!currentResumeName) return;

  const { data, error } = await db
    .from("portfolio_resume")
    .select("id, file_name, file_path, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    currentResumeName.textContent = "No resume uploaded yet.";

    if (resumePreviewContainer) {
      resumePreviewContainer.hidden = true;
    }

    return;
  }

  currentResumeName.textContent = data.file_name;

  const { data: publicData } = db.storage
    .from(RESUME_BUCKET)
    .getPublicUrl(data.file_path);

  if (resumePreview) {
    resumePreview.src = publicData.publicUrl + "?t=" + Date.now();
  }

  if (resumePreviewContainer) {
    resumePreviewContainer.hidden = false;
  }
}


// UPLOAD / REPLACE RESUME
if (resumeForm) {
  resumeForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const file = resumeInput?.files?.[0];

    if (!file) {
      showResumeStatus("Please select a PDF file.");
      return;
    }

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      showResumeStatus("Only PDF files are allowed.");
      return;
    }

    if (file.size > MAX_RESUME_SIZE) {
      showResumeStatus("Resume file must be below 10 MB.");
      return;
    }

    resumeUploadBtn.disabled = true;
    showResumeStatus("Uploading resume...");

    try {
      // Upload PDF to Supabase Storage
      const { error: uploadError } = await db.storage
        .from(RESUME_BUCKET)
        .upload(RESUME_FILE_PATH, file, {
          upsert: true,
          contentType: "application/pdf",
          cacheControl: "0"
        });

      if (uploadError) throw uploadError;

      // Check whether a resume record already exists
      const { data: existingResume, error: selectError } = await db
        .from("portfolio_resume")
        .select("id")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (selectError) throw selectError;

      const resumeRecord = {
        file_name: file.name,
        file_path: RESUME_FILE_PATH,
        updated_at: new Date().toISOString()
      };

      let databaseResult;

      if (existingResume) {
        databaseResult = await db
          .from("portfolio_resume")
          .update(resumeRecord)
          .eq("id", existingResume.id);
      } else {
        databaseResult = await db
          .from("portfolio_resume")
          .insert(resumeRecord);
      }

      if (databaseResult.error) {
        throw databaseResult.error;
      }

      resumeInput.value = "";

      await loadResume();

      showResumeStatus("Resume uploaded successfully!", true);
      alert("Resume uploaded successfully!");

    } catch (error) {
      console.error("Resume upload error:", error);
      showResumeStatus("Upload failed: " + error.message);
      alert("Resume upload failed: " + error.message);

    } finally {
      resumeUploadBtn.disabled = false;
    }
  });
}


// REPLACE BUTTON
if (resumeReplaceBtn && resumeInput) {
  resumeReplaceBtn.addEventListener("click", () => {
    resumeInput.click();
  });
}


// DELETE RESUME
if (resumeDeleteBtn) {
  resumeDeleteBtn.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to delete the current resume?")) {
      return;
    }

    resumeDeleteBtn.disabled = true;
    showResumeStatus("Deleting resume...");

    try {
      // Read current resume record
      const { data: existingResume, error: selectError } = await db
        .from("portfolio_resume")
        .select("id, file_path")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (selectError) throw selectError;

      if (!existingResume) {
        showResumeStatus("No resume found.");
        return;
      }

      // Delete PDF from Storage
      const { error: storageError } = await db.storage
        .from(RESUME_BUCKET)
        .remove([existingResume.file_path]);

      if (storageError) throw storageError;

      // Delete database record
      const { error: databaseError } = await db
        .from("portfolio_resume")
        .delete()
        .eq("id", existingResume.id);

      if (databaseError) throw databaseError;

      await loadResume();

      showResumeStatus("Resume deleted successfully.", true);
      alert("Resume deleted successfully!");

    } catch (error) {
      console.error("Resume delete error:", error);
      showResumeStatus("Delete failed: " + error.message);
      alert("Resume delete failed: " + error.message);

    } finally {
      resumeDeleteBtn.disabled = false;
    }
  });
}


    // =====================================
    // ABOUT ME MANAGEMENT
    // =====================================

async function loadAbout() {
  const { data, error } = await db
    .from("portfolio_about")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("About loading error:", error);
    return;
  }

  const list = document.getElementById("aboutList");
  if (!list) return;

  list.replaceChildren();

  if (!data) return;

  list.appendChild(
    createItem(
      "About Me Description",
      data.description,

      // EDIT ABOUT
      () => {
        document.getElementById("aboutDescription").value =
          data.description || "";

        document.getElementById("aboutForm")
          .scrollIntoView({ behavior: "smooth" });
      },

      // DELETE ABOUT
      async () => {
        if (!confirm("Delete About Me description?")) return;

        const { error } = await db
          .from("portfolio_about")
          .delete()
          .eq("id", 1);

        if (error) {
          alert(error.message);
          return;
        }

        document.getElementById("aboutDescription").value = "";

        await loadAbout();
        alert("About description deleted successfully!");
      }
    )
  );
}

            // ADD / UPDATE ABOUT DESCRIPTION

            document.getElementById("aboutForm").addEventListener(
            "submit",
            async (event) => {
                event.preventDefault();

                const description = document
                .getElementById("aboutDescription")
                .value.trim();

                if (!description) {
                alert("Please enter About Me description.");
                return;
                }

                const button = event.target.querySelector(
                "button[type='submit']"
                );

                button.disabled = true;

                try {
                const { error } = await db
                    .from("portfolio_about")
                    .upsert(
                    {
                        id: 1,
                        description: description,
                        updated_at: new Date().toISOString()
                    },
                    { onConflict: "id" }
                    );

                if (error) throw error;

                await loadAbout();

                alert("About description saved successfully!");
                } catch (error) {
                console.error("About save error:", error);
                alert("About save failed: " + error.message);
                } finally {
                button.disabled = false;
                }
            }
        );

  // =====================================
  // LOAD PROJECTS
  // =====================================

  async function loadProjects() {
    const { data, error } = await db
      .from("portfolio_projects")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: false });

    if (error) throw error;
    console.log("PROJECT DATA:", data);
    console.log("PROJECT ERROR:", error);
    projects = data || [];
    renderProjects();
  }

  function renderProjects() {
    const list = document.getElementById("projectList");
    list.replaceChildren();
    console.log("PROJECT LIST ELEMENT:", list);
    projects.forEach((project) => {
      list.appendChild(
        createItem(
          project.title,
          project.category || project.description,
          () => {
            editingProject = project.id;

            document.getElementById("projectTitle").value = project.title || "";
            document.getElementById("projectCategory").value = project.category || "";
            document.getElementById("projectDescription").value = project.description || "";
            document.getElementById("projectLink").value = project.project_url || "";

            document.querySelector("#projectForm button[type='submit']").innerHTML =
              '<i class="fa-solid fa-floppy-disk"></i> Update Project';

            document.getElementById("projectForm")
              .scrollIntoView({ behavior: "smooth" });
          },
          async () => {
            if (!confirm("Delete this project?")) return;

            const { error } = await db
              .from("portfolio_projects")
              .delete()
              .eq("id", project.id);

            if (error) {
              alert(error.message);
              return;
            }

            await loadProjects();
          }
        )
      );
    });

    document.getElementById("projectCount").textContent = projects.length;
  }

  document.getElementById("projectForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const project = {
      title: document.getElementById("projectTitle").value.trim(),
      category: document.getElementById("projectCategory").value.trim(),
      description: document.getElementById("projectDescription").value.trim(),
      project_url: document.getElementById("projectLink").value.trim() || null
    };

    if (!project.title || !project.description) return;

    let result;

    if (editingProject !== null) {
      result = await db
        .from("portfolio_projects")
        .update(project)
        .eq("id", editingProject);
    } else {
      result = await db
        .from("portfolio_projects")
        .insert(project);
    }

    if (result.error) {
      alert(result.error.message);
      return;
    }

    editingProject = null;
    event.target.reset();

    event.target.querySelector("button[type='submit']").innerHTML =
      '<i class="fa-solid fa-plus"></i> Add Project';

    await loadProjects();
  });
  // =====================================
  // LOAD SKILLS
  // =====================================

  function getSkillIcon(category) {
    const value = (category || "").toLowerCase();

    if (value.includes("frontend") || value.includes("web")) return "fa-code";
    if (value.includes("programming")) return "fa-laptop-code";
    if (value.includes("database")) return "fa-database";
    if (value.includes("embedded") || value.includes("iot")) return "fa-microchip";
    if (value.includes("tool")) return "fa-screwdriver-wrench";
    if (value.includes("productivity")) return "fa-file-lines";
    if (value.includes("ai")) return "fa-brain";

    return "fa-code";
  }

  async function loadSkills() {
    const { data, error } = await db
      .from("portfolio_skills")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });

    if (error) throw error;

    skills = data || [];
    renderSkills();
  }

  function renderSkills() {
    const list = document.getElementById("skillList");

    if (!list) return;

    list.replaceChildren();

    const categories = {};

    skills.forEach(skill => {
      const category = skill.category || "Other Skills";

      if (!categories[category]) {
        categories[category] = [];
      }

      categories[category].push(skill);
    });

    Object.entries(categories).forEach(([category, categorySkills]) => {

      const heading = document.createElement("h3");
      heading.textContent = category;
      heading.className = "skill-category-heading";

      list.appendChild(heading);

      categorySkills.forEach(skill => {

        list.appendChild(
          createItem(
            skill.name,
            category,

            () => {
              editingSkill = skill.id;

              document.getElementById("skillCategory").value =
                skill.category || "";

              document.getElementById("skillNames").value =
                skill.name || "";

              document.querySelector(
                "#skillForm button[type='submit']"
              ).innerHTML =
                '<i class="fa-solid fa-floppy-disk"></i> Update Skill';

              document.getElementById("skillForm")
                .scrollIntoView({ behavior: "smooth" });
            },

            async () => {
              if (!confirm("Delete this skill?")) return;

              const { error } = await db
                .from("portfolio_skills")
                .delete()
                .eq("id", skill.id);

              if (error) {
                alert(error.message);
                return;
              }

              await loadSkills();
            }
          )
        );

      });
    });

    const count = document.getElementById("skillCount");

    if (count) {
      count.textContent = skills.length;
    }
  }

  // ADD / UPDATE SKILLS

  document.getElementById("skillForm").addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const category = document
        .getElementById("skillCategory").value.trim();

      const names = document
        .getElementById("skillNames").value
        .split(",")
        .map(name => name.trim())
        .filter(Boolean);

      if (!category || names.length === 0) {
        alert("Please enter a category and at least one skill.");
        return;
      }

      const icon = getSkillIcon(category);

      let result;

      if (editingSkill !== null) {

        if (names.length !== 1) {
          alert("While editing, enter only one skill.");
          return;
        }

        result = await db
          .from("portfolio_skills")
          .update({
            name: names[0],
            category: category,
            icon: icon
          })
          .eq("id", editingSkill);

      } else {

        const newSkills = names.map((name, index) => ({
          name,
          category,
          icon,
          sort_order: index
        }));

        result = await db
          .from("portfolio_skills")
          .insert(newSkills);
      }

      if (result.error) {
        alert("Skills save failed: " + result.error.message);
        return;
      }

      editingSkill = null;

      event.target.reset();

      event.target.querySelector(
        "button[type='submit']"
      ).innerHTML =
        '<i class="fa-solid fa-plus"></i> Add Skills';

      await loadSkills();

      alert("Skills saved successfully!");
    }
  );


  // =====================================
  // LOAD EDUCATION
  // =====================================

  async function loadEducation() {
    const { data, error } = await db
      .from("portfolio_education")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;

    education = data || [];
    renderEducation();
  }

  function renderEducation() {
    const list = document.getElementById("educationList");

    if (!list) return;

    list.replaceChildren();

    education.forEach((item) => {
      list.appendChild(
        createItem(
          item.qualification,
          [
            item.institution,
            item.start_year && item.end_year
              ? `${item.start_year} - ${item.end_year}`
              : item.start_year || item.end_year,
            item.grade,
            item.description
          ].filter(Boolean).join(" | "),

          // EDIT EDUCATION
          () => {
            editingEducation = item.id;

            document.getElementById("educationQualification").value =
              item.qualification || "";

            document.getElementById("educationInstitution").value =
              item.institution || "";

            document.getElementById("educationStartYear").value =
              item.start_year || "";

            document.getElementById("educationEndYear").value =
              item.end_year || "";

            document.getElementById("educationGrade").value =
              item.grade || "";

            document.getElementById("educationDescription").value =
              item.description || "";

            document.querySelector(
              "#educationForm button[type='submit']"
            ).innerHTML =
              '<i class="fa-solid fa-floppy-disk"></i> Update Education';

            document.getElementById("educationForm")
              .scrollIntoView({ behavior: "smooth" });
          },

          // DELETE EDUCATION
          async () => {
            if (!confirm("Delete this education record?")) return;

            const { error } = await db
              .from("portfolio_education")
              .delete()
              .eq("id", item.id);

            if (error) {
              alert(error.message);
              return;
            }

            await loadEducation();
          }
        )
      );
    });
  }

  // ADD / UPDATE EDUCATION
    console.log("EDUCATION FORM HANDLER READY");
    document.getElementById("educationForm").addEventListener("submit", async (event) => {
    console.log("EDUCATION SUBMIT FIRED");
    event.preventDefault();

  const button = event.target.querySelector("button[type='submit']");
  button.disabled = true;

  const educationData = {
    qualification: document.getElementById("educationQualification").value.trim(),
    institution: document.getElementById("educationInstitution").value.trim(),
    start_year: document.getElementById("educationStartYear").value.trim(),
    end_year: document.getElementById("educationEndYear").value.trim(),
    grade: document.getElementById("educationGrade").value.trim(),
    description: document.getElementById("educationDescription").value.trim()
  };

  try {
    if (!educationData.qualification || !educationData.institution) {
      alert("Please enter qualification and institution.");
      return;
    }

    let result;

    if (editingEducation !== null) {
      result = await db
        .from("portfolio_education")
        .update(educationData)
        .eq("id", editingEducation);
    } else {
      result = await db
        .from("portfolio_education")
        .insert(educationData);
    }

    if (result.error) {
      throw result.error;
    }

    editingEducation = null;
    event.target.reset();

    button.innerHTML = '<i class="fa-solid fa-plus"></i> Add Education';

    await loadEducation();

    alert("Education saved successfully!");

  } catch (error) {
    console.error("Education Error:", error);
    alert("Education save failed: " + error.message);
  } finally {
    button.disabled = false;
  }
});


  // =====================================
  // LOAD CERTIFICATIONS
  // =====================================

  async function loadCertifications() {
    const { data, error } = await db
      .from("portfolio_certifications")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;

    certifications = data || [];
    renderCertifications();
  }

  function renderCertifications() {
    const list = document.getElementById("certList");
    list.replaceChildren();

    certifications.forEach((cert) => {
      list.appendChild(
        createItem(
          cert.title,
          cert.issuer || "",
          () => {
            editingCert = cert.id;

            document.getElementById("certTitle").value = cert.title || "";
            document.getElementById("certOrganization").value = cert.issuer || "";

            document.querySelector("#certForm button[type='submit']").innerHTML =
              '<i class="fa-solid fa-floppy-disk"></i> Update Certificate';

            document.getElementById("certForm")
              .scrollIntoView({ behavior: "smooth" });
          },
          async () => {
            if (!confirm("Delete this certificate?")) return;

            const { error } = await db
              .from("portfolio_certifications")
              .delete()
              .eq("id", cert.id);

            if (error) {
              alert(error.message);
              return;
            }

            await loadCertifications();
          }
        )
      );
    });

    document.getElementById("certCount").textContent = certifications.length;
  }

  document.getElementById("certForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const cert = {
      title: document.getElementById("certTitle").value.trim(),
      issuer: document.getElementById("certOrganization").value.trim()
    };

    if (!cert.title) return;

    let result;

    if (editingCert !== null) {
      result = await db
        .from("portfolio_certifications")
        .update(cert)
        .eq("id", editingCert);
    } else {
      result = await db
        .from("portfolio_certifications")
        .insert(cert);
    }

    if (result.error) {
      alert(result.error.message);
      return;
    }

    editingCert = null;
    event.target.reset();

    event.target.querySelector("button[type='submit']").innerHTML =
      '<i class="fa-solid fa-plus"></i> Add Certificate';

    await loadCertifications();
  });

  // =====================================
  // LOAD CONTACT MESSAGES
  // =====================================

  async function loadMessages() {
    const { data, error } = await db
      .from("portfolio_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    messages = data || [];
    renderMessages();
  }

  function renderMessages() {
    const list = document.getElementById("messageList");
    list.replaceChildren();

    messages.forEach((message) => {
      const description = [
        message.email,
        message.subject,
        message.message
      ].filter(Boolean).join(" | ");

      list.appendChild(
        createItem(
          message.name,
          description,
          null,
          async () => {
            if (!confirm("Delete this message?")) return;

            const { error } = await db
              .from("portfolio_messages")
              .delete()
              .eq("id", message.id);

            if (error) {
              alert(error.message);
              return;
            }

            await loadMessages();
          }
        )
      );
    });

    document.getElementById("messageCount").textContent = messages.length;
  }

  // =====================================
  // LOAD ALL DASHBOARD DATA
  // =====================================

  async function loadAllData() {
    try {
        await Promise.all([
        loadProjects(),
        loadSkills(),
        loadEducation(),
        loadCertifications(),
        loadMessages(),
        loadAbout(),
        loadProfileImage(),
        loadResume()
        ]);
    } catch (error) {
      console.error("Dashboard loading error:", error);
      alert("Unable to load dashboard data: " + error.message);
    }
  }

  // =====================================
  // AUTH STATE LISTENER
  // =====================================

  db.auth.onAuthStateChange((event, session) => {
    setTimeout(async () => {
      if (event === "PASSWORD_RECOVERY") {
        showScreen("reset");
        return;
      }

      if (session?.user) {
        if (activeUserId !== session.user.id) {
          await verifyOwner(session.user);
        }
      } else {
        activeUserId = null;
        showScreen("login");
      }
    }, 0);
  });

  // =====================================
  // CHECK EXISTING SESSION
  // =====================================

  async function initializeAuth() {
    showScreen("login");

    const { data, error } = await db.auth.getSession();

    if (error) {
      showMessage(loginMessage, error.message);
      return;
    }

    if (data.session?.user) {
      await verifyOwner(data.session.user);
    } else {
      showScreen("login");
    }
  }

  initializeAuth();
});
