$(function() {
  $("#username").focus();
  $("#table").stupidtable();

  $('a[href^="#"]').click(function(e) {
    e.preventDefault();

    var elem = $(this).attr("href");
    $(elem).toggleClass("hidden");

    // For the CSS.
    $(this).toggleClass("sibling-hidden");
  });
});

Number.prototype.round = function(dp) {
  var f = Math.pow(10, dp);
  return Math.round(this * f) / f;
}


var types = ["", "TV", "OVA", "Movie", "Special", "ONA", "Music"];
var episodeLengths = {
  "TV": 25,
  "OVA": 25,
  "Movie": 120,
  "Special": 8,
  "ONA": 25,
  "Music": 3
};

var total = 0;

$("#form").ajaxForm({
  beforeSubmit: function() {
    // Might as well use .hidden to hide everything.
    $("#form-holder").addClass("hidden");
    $("#result").text("Doing the math...");
  },

  // 2017-01-14: Now using CORS proxy. Needs this header specified to continue.
  headers: {
    "X-Requested-With": "XMLHTTPRequest"
  },

  success: function(data) {
    // I hate XML.
    data = new X2JS().xml2json(data);

    // Handle invalid username.
    // Well, it raises errors for different situations as well,
    // but too lazy to deal with those.
    if ( !(data.myanimelist || data.myanimelist.anime) ) {
      $("#result").text("Error: Invalid Username.");
      return;
    };

    var allAnime = data.myanimelist.anime;

    var anime, seriesType, episodeLength, episodeCount, seriesLength;
    var $tableRow;
    for (var i=0; i < allAnime.length; i++) {
      anime = allAnime[i];

      // Status parameter not working properly for some reason,
      // so has to manually filter out stuff that isn't on PTW.
      // (PTW = status "6")
      if (!(anime.my_status == "6")) {
        continue;
      };

      if (!(anime.series_status == "2")) {
        // Anime has not finished airing / hasn't aired. Don't count this.
        // Completed series' have series_status of "2"
        continue;
      };

      // Find the type from "series_type".
      seriesType = anime.series_type;
      seriesType = Number(seriesType);
      seriesType = types[seriesType];

      // Find out length of an episode of said type.
      episodeLength = episodeLengths[seriesType];

      // Get episode count.
      episodeCount = anime.series_episodes;
      episodeCount = Number(episodeCount);

      // Multiply the length of an episode by the number of episodes
      // to get the length of a series (in minutes).
      seriesLength = episodeLength * episodeCount;

      // Add info to the table.
      $tableRow = $("<tr>");
      $tableRow.append('<td class="title">' + anime.series_title + "</td>");
      $tableRow.append("<td>" + episodeLength + "</td>");
      $tableRow.append("<td>" + episodeCount + "</td>");
      $tableRow.append("<td>" + seriesLength + "</td>");
      $("#table").append($tableRow);

      // Add onto the total.
      total += seriesLength;
    }

    $("#total-times #mins").text( total.round(3) );
    total /= 60
    $("#total-times #hours").text( total.round(3) );
    total /= 24
    $("#total-times #days").text( total.round(3) );

    // Show user the result.
    $("#result").html("Days to complete anime on PTW: <strong>" + total.round(2) + "</strong>");

    // Recommended way of sorting doesn't work, so has to be clicked manually.
    $("#table thead th").eq(0).click();
  }
})
