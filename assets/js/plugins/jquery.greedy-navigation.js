/*
* Greedy Navigation
*
* http://codepen.io/lukejacksonn/pen/PwmwWV
*
*/

var $nav = $('#site-nav');
var $btn = $('#site-nav button');
var $vlinks = $('#site-nav .visible-links');
var $hlinks = $('#site-nav .hidden-links');

// Disable greedy navigation - always show all links and hide the button
function updateNav() {
  // Always hide the button
  $btn.addClass('hidden');
  $hlinks.addClass('hidden');
  
  // Move all hidden links back to visible links
  $hlinks.children().appendTo($vlinks);
}

// Window listeners
$(window).resize(function() {
  updateNav();
});

// Initialize
updateNav();