(function () {
  var base = window.BASE || "";
  var root = document.documentElement;
  var toggle = document.getElementById("theme");
  toggle.checked = root.dataset.theme === "dark";
  toggle.addEventListener("change", function () {
    var t = toggle.checked ? "dark" : "light";
    root.dataset.theme = t;
    try { localStorage.setItem("site-theme", t); } catch (e) {}
  });

  var btn = document.getElementById("menu-btn");
  btn.addEventListener("click", function () {
    if (window.innerWidth <= 800) { document.body.classList.toggle("nav-open"); return; }
    var c = root.classList.toggle("nav-collapsed");
    try { localStorage.setItem("nav-collapsed", c ? "1" : "0"); } catch (e) {}
  });

  var active = document.querySelector(".tree li.active");
  if (active) active.scrollIntoView({ block: "nearest" });

  var q = document.getElementById("q"), res = document.getElementById("results"), idx = null;
  function load() {
    if (idx) return Promise.resolve(idx);
    return fetch(base + "/search.json").then(function (r) { return r.json(); }).then(function (j) { return (idx = j); });
  }
  q.addEventListener("focus", load);
  q.addEventListener("input", function () {
    var s = q.value.trim().toLowerCase();
    res.innerHTML = "";
    if (!s) return;
    load().then(function (pages) {
      var n = 0;
      pages.forEach(function (p) {
        if (n < 15 && p.t.toLowerCase().indexOf(s) >= 0) { add(p.t, "", p.u); n++; }
        p.h.forEach(function (h) {
          if (n < 15 && h.t.toLowerCase().indexOf(s) >= 0) { add(h.t, p.t, p.u + "#" + h.i); n++; }
        });
      });
    });
  });
  function add(text, sub, href) {
    var li = document.createElement("li"), a = document.createElement("a");
    a.href = href; a.textContent = text;
    if (sub) { var sm = document.createElement("small"); sm.textContent = sub; a.appendChild(sm); }
    li.appendChild(a); res.appendChild(li);
  }
  document.addEventListener("click", function (e) { if (!e.target.closest(".search")) res.innerHTML = ""; });
})();
