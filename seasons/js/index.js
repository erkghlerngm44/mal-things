$(() => {
    $("#u").focus();
});


// https://stackoverflow.com/a/18881828
Number.prototype.between = function(a, b) {
    const min = Math.min(a, b),
          max = Math.max(a, b);
    return this >= min && this <= max;
};
// https://stackoverflow.com/a/3291856
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};


const dateRe = /(\d{4})-(\d{2})-\d{2}/;


const seasons = [
    {
        name: "winter",
        // Note: Referring to month range as [min month, max month]
        range: [1, 3],
        order: 0
    },
    {
        name: "spring",
        range: [4, 6],
        order: 1
    },
    {
        name: "summer",
        range: [7, 9],
        order: 2
    },
    {
        name: "fall",
        range: [10, 12],
        order: 3
    }
];


// Form handler
$("#form").ajaxForm({
    beforeSubmit: () => {
        $("#form").hide();
        $("#status").text("Working...");
    },
    headers: {
        "X-Requested-With": "XMLHTTPRequest"
    },
    success: (data) => {
        $("#status")
            .addClass("success")
            .text("Success!");

        // XML to JS because XML is shit
        data = new X2JS().xml2json(data);

        // Invalid username and other crap
        if ( !(data.myanimelist || data.myanimelist.anime) ) {
            $("#status")
                .addClass("error")
                .text("Error - Invalid Username");
        }

        const allAnime = data.myanimelist.anime;

        let anime, date, year, month, season;
        for (let i=0; i < allAnime.length; i++) {
            anime = allAnime[i];

            // Ignore stuff that's on PTW
            // PTW == Status "6"
            // TODO: Extend to anything on on watching or completed?
            if (anime.my_status === "6") continue;

            date = dateRe.exec(anime.series_start);

            year = Number(date[1]);
            month = Number(date[2]);

            // Find the season the month was in
            // FIXME
            for (let j=0; j < seasons.length; j++) {
                if (month.between(...seasons[j].range)) {
                    season = seasons[j];
                }
            }

            let $el = $(`.season[data-year="${year}"][data-season="${season.name}"]`);

            if (!$el.length) {
                // Make it if it doesn't exist
                $el = $("<ul>", {
                    class: "season",
                    html: `<h2>${year} - ${season.name.capitalize()}</h2>`,
                    "data-year": year,
                    "data-season": season.name,
                    "data-season-order": season.order
                }).appendTo("#seasons");
            }

            $el.append(`<li>${anime.series_title}</li>`);
        }

        // Sort the stuff because MAL's weird
        $(".season").sort((a, b) => {
            // FIXME: complicated shit here
            let x = $(a).data("year");
            let y = $(b).data("year");

            if (x === y) {
                // Years are equal
                // Reassign `x` and `y` to sort by season instead of year
                x = $(a).data("season-order");
                y = $(b).data("season-order");
            }

            return y < x ? 1 : -1
        }).appendTo("#seasons");

        // Alphabetically sort all the anime in each .season
        // Meh whatever, chaining is fun and I'm too sleepy to
        // bother breaking this down. It just works, kay?
        $(".season").each((index, el) => $(el).find("li").sort((a, b) => $(b).text() < $(a).text() ? 1 : -1).appendTo(el))
    }
});
