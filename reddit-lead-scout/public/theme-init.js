(function () {
  try {
    var t = localStorage.getItem("rls-theme") || "dark";
    if (t === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
})();
