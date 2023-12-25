class Article {
  constructor(element) {
    this.element = element;
    this.title = element.data("title");
    this.subtitle = element.data("subtitle");
    this.author = element.data("author");
    this.date = element.data("date");
    this.people = $("span.person[id]");
    this.organizations = $("span.organization");
    this.places = $("span.place");
    this.dates = $("span.date");
  }
}

function goto(className) {
  let scrollPos = $(".article-container").scrollTop();
  let elements = $(`.${className}`);

  let nextElements = elements.filter(function () {
    return $(this).offset().top > 30;
  })

  if (nextElements.length > 0) {
    nextElement = nextElements.first();
  } else if (nextElements.length = 0 || nextElement.offset().top < scrollPos) {
    nextElement = elements.first();
  }

  $(".article-container").animate({ scrollTop: (scrollPos + nextElement.offset().top) - 30 }, 1000, "easeOutCubic");

  //console.log(nextElement.offset().top, scrollPos, nextElement.offset().top < scrollPos)

  $(".animate").removeClass("animate");
  nextElement.addClass("animate");
}

function displayMetadata(article) {
  $(".article-title").text(article.title);
  $(".article-author").text(article.author);
  $(".article-subtitle").text(article.subtitle);
  $(".article-date").text(article.date);

  const appendMetadataToList = (container, data, type) => {
    data.each((index, el) => {
      const listItem = $(
        `<li class="metadata-entry" onclick="goto('${el.id}')"></li>`
      ).text(el.dataset.name);
      container.append(listItem);
    });
  };

  appendMetadataToList($(".persList"), article.people);
  appendMetadataToList($(".orgList"), article.organizations);
  appendMetadataToList(
    $(".dateList"),
    article.dates.sort((a, b) => a.id - b.id)
  );

  $(".wiki-close").on("click", function (e) {
    $(".wiki-container").fadeOut(100);
    $(".article-map-container").fadeIn();
    $(".metadata-entry").removeClass("active");
    $(".wiki-thumbnail, .wiki-extract").fadeOut(300, function () {
      $(this).empty();
      $(".wiki-thumbnail").attr("src", "");
    });
  });

  $(".metadata-entry").on("click", function (e) {
    if (!$(this).hasClass("active")) {
      wikiCall($(this).text());
      $(".article-map-container").hide();
      $(".wiki-container").fadeIn({
        start: function () {
          jQuery(this).css("display", "flex");
        },
      });
      $(".metadata-entry").removeClass("active");
      $(this).toggleClass("active");

    }
  });
}

$(document).on("click", ".metadata-tab-button", function (e) {
  if (!$(this).hasClass("active")) {
    $(".metadata-tab-button").removeClass("active");
    $(".metadata-list-container").removeClass("active");
    const tabId = $(this).attr("id").replace("-tab-button", "-tab");
    $(this).addClass("active");
    $("#" + tabId)
      .addClass("active")
      .hide()
      .fadeIn(500);
  }
});

$(document).on("click", ".style-selector-container", function (e) {
  const $target = $(e.target);
  if ($target.hasClass("style-selector-container")) {
    $(".style-selector-container").fadeOut(500);
  }
});

function buildPage() {
  /*$.get("components/header.html", function (data) {
    /*$("main").before(data);
  });*/

  $("main").prepend('<div class="loading-spinner"></div>');
  $("main").prepend('<div class="style-selector-container" style="display: none;"></div>');
  $(".style-selector-container").load("components/style-selector.html");

  if (getStyleCookie() === null) {
    $(".style-selector-container").show();
  } else {
    changeStyle(getStyleCookie());
  }

  const urlSearchParams = new URLSearchParams(window.location.search);
  const issue = urlSearchParams.get("issue");
  const [articleNumber, article] = urlSearchParams
    .get("article")
    .split(/-(.+)/);
  $.ajax({
    url: `issues/${issue}/${articleNumber}/${article}.html`,
    dataType: "html",
    success: function (data) {
      $(".article-container").html(data);
      const articleObj = new Article($("article").first());
      document.title = `${articleObj.title}, by ${articleObj.author}`;
      displayMetadata(articleObj);
      $(".article-title").quickfit({ max: 90, min: 50, truncate: false });

      if (getStyleCookie() === "1500-article.css") {
        mapbox();
        Css1500.countLines();
        Css1500.dropCaps();
        $(".article-date").text(Css1500.dateToRoman(articleObj.date));
      } else if (getStyleCookie() === "future-article.css") {
        Css1500.revert1500(articleObj.date);
        //initializeGlobe();
      };

      $(".loading-spinner").hide();
      $(".article-text, .metadata-container").animate({opacity: 0.9}, 700)
      $(".header-container").animate({"right": '0'}, 500)
    },
    error: function (xhr, status, error) {
      if (xhr.status === 404) {
        var $errorContainer = $("<div>").addClass("error-container");
        $('.article-container, .metadata-container').remove();
        $("main").append($errorContainer.load("404.html"));
        $(".loading-spinner").hide();
      } else {
        alert("An unexpected error occurred. Check the console for details.");
      }
    },
  });
}

//wikipedia//
function wikiCall(subject) {
  $(".wiki-thumbnail, .wiki-extract").fadeOut(300, function () {
    $(this).empty();
    $(".wiki-thumbnail").attr("src", "");
  });

  $(".wiki-loading").fadeIn(300);

  $.ajax({
    url: "http://en.wikipedia.org/w/api.php",
    data: {
      action: "query",
      list: "search",
      srsearch: subject,
      format: "json",
    },
    dataType: "jsonp",
    success: function (data) {
      title = data.query.search[0].title;
      $.ajax({
        url: "https://en.wikipedia.org/api/rest_v1/page/summary/" + title,
        dataType: "json",
        success: function (data) {
          var thumbnail = new Image();
          if (data.thumbnail && data.thumbnail.source) {
            thumbnail.src = data.thumbnail.source;
            thumbnail.onload = function () {
              $(".wiki-loading").fadeOut();
              $(".wiki-thumbnail").fadeIn(300).attr("src", thumbnail.src);
              $(".wiki-extract").fadeIn(300).html(data.extract);
            };
          } else {
            $(".wiki-loading").fadeOut();
            $(".wiki-thumbnail").text("Image not found").fadeIn(300);
            $(".wiki-extract").fadeIn(300).html(data.extract);
          }
        },
      });
    },
    error: function (xhr, status, error) {
      console.log("Error: " + error);
    },
  });
}

//map//
function mapbox() {
  mapboxgl.accessToken =
    "pk.eyJ1IjoibHppbGwiLCJhIjoiY2xuNjlkODZpMGVjczJtcW1wN2VkcHExaSJ9.zhOJVlpnVZXhtBntooFkgw";

  var map = new mapboxgl.Map({
    container: "article-map",
    style: "mapbox://styles/lzill/cln69j4oi039y01qu4eugc6lw",
    center: [0, 30],
    zoom: 1,
    attributionControl: false,
  });

  map.on("idle", function () {
    map.resize();
  });

  places = $('span.place#cheyenne')

  places.each( function() {
    let coordinates = $(this).data('coord').split(',');
    var category = $(this).hasClass('city') ? 'city' : 'state';

    new mapboxgl.Marker()
      .setLngLat([parseFloat(coordinates[0]), parseFloat(coordinates[1])])
      .addTo(map);
  })

  map.dragRotate.disable();
  map.touchZoomRotate.disableRotation();
}

//style change//
$(document).on(
  "click",
  "#change-style-button, #fab-style-button",
  function (e) {
    $(".style-selector-container").fadeIn(500);
  }
);

function changeStyle(style) {
  const selector = $(".style-selector-container");

  if ($("#style").attr("href").includes(style)) {
    selector.fadeOut(500);
    writeStyleInCookie(style);
  } else {
    $("#style").attr("href", "/styles/" + style);
    Css1500.revert1500();
    if (style === "1500-article.css") {
      Css1500.apply1500();
    };
    writeStyleInCookie(style);
    setTimeout(() => {
      selector.fadeOut(500);
    }, 500);
  }
}

function writeStyleInCookie(style) {
  const expirationDate = new Date(
    new Date().getTime() + 7 * 24 * 60 * 60 * 1000
  );
  document.cookie =
    "style=" + style + "; expires=" + expirationDate + "; path=/";
}

function getStyleCookie() {
  const name = "style=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return null;
}

//floating action button//
$(".fab-icon").click(function (e) {
  e.stopPropagation();
  $(".fab-wrapper").toggleClass("active");
});

$(document).click(function (e) {
  $(".fab-wrapper").removeClass("active");
});

$("#fab-metadata-button").click(function (e) {
  $(".metadata-container").toggleClass("active");
  $(".article-container").toggleClass("covered");
});

$(".article-container").click(function (e) {
  $(".metadata-container").removeClass("active");
  $(".article-container").removeClass("covered");
});

//1500.css-related functions//
const Css1500 = {
  countLines: () => {
    let articleLines = 0;
    $("article p").each(function () {
      const lineHeight = parseFloat($(this).css("line-height"));
      const height = $(this).height();
      const lines = Math.round(height / lineHeight) + 1;
      articleLines += lines;
      $(this).next("p").attr("data-lines", articleLines);
    });
  },

  dropCaps: () => {
    const firstParagraph = document.querySelector(
      ".article-text p:first-of-type"
    );
    const firstLetter = firstParagraph.textContent.trim().charAt(0);
    const remainingText = firstParagraph.innerHTML.trim().slice(1);

    firstParagraph.innerHTML = `<span class="drop-cap">${firstLetter}</span>${remainingText}`;
    document.querySelector(
      ".drop-cap"
    ).style.backgroundImage = `url(img/1500/icaps/${firstLetter.toLowerCase()}.gif)`;
  },

  dateToRoman: (num) => {
    const roman = {
      M: 1000,
      CM: 900,
      D: 500,
      CD: 400,
      C: 100,
      XC: 90,
      L: 50,
      XL: 40,
      X: 10,
      IX: 9,
      V: 5,
      IV: 4,
      I: 1,
    };
    return num
      .split("/")
      .map((d) => parseInt(d))
      .map((d, i) =>
        Object.keys(roman).reduce((acc, key) => {
          const q = Math.floor(d / roman[key]);
          d -= q * roman[key];
          return acc + key.repeat(q);
        }, "")
      )
      .join(" ");
  },

  revert1500: (date) => {
    const firstParagraph = document.querySelector(".article-text p:first-of-type");

    if (firstParagraph) {
      const dropCapSpan = firstParagraph.querySelector(".drop-cap");

      if (dropCapSpan && dropCapSpan.nextSibling) {
        const originalText = dropCapSpan.textContent + dropCapSpan.nextSibling.textContent;
        firstParagraph.textContent = originalText;
      }
    }

    const articleDate = $(".article-date");
    if (articleDate.length) {
      articleDate.text(date);
    }

    const articleParagraphs = $("article p");
    if (articleParagraphs.length) {
      articleParagraphs.removeAttr("data-lines");
    }

    $(".article-date").text(
      $('article').first().data("date")
    );
  },

  apply1500: () => {
    Css1500.countLines();
    Css1500.dropCaps();
    $(".article-date").text(
      Css1500.dateToRoman($(".article-date").text().replace(/ /g, "/"))
    );
  },
};

//---------------------------//

$(document).ready(function () {
  buildPage();
  setTimeout(function () {
    document.body.className = "";
  }, 500);
});

//https://stackoverflow.com/questions/6805482/css3-transition-animation-on-load
