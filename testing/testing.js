document.getElementById('toggle-sidebar').addEventListener('click', function() {
  var sidebar = document.getElementById('sidebar');
  var content = document.querySelector('.content-bar');

  sidebar.classList.toggle('hidden');
  content.classList.toggle('full-width');
});
