const themeId = document.getElementById("themeId");
const input = document.getElementById("searchTerms");
const resultsDiv = document.getElementById("results");
const observedDiv = document.querySelector(".observedDiv");
const loader = document.querySelector(".loader");

const theme = {
    dark: false
}

const darkMode = new Proxy(theme, {
    set(target, prop, value) {
        target[prop] = value;
        document.body.className = value ? "dark" : "light";

        return true
    }
})

themeId.addEventListener("click", () => {
    darkMode.dark = !theme.dark;
})


// start debouncing for search
function myDebounce(fn, delay = 300) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(()=> fn.apply(this, args), delay)
    }
}

async function* searchGithub(query, signal) {
    if (!query) return;
    let page = 1;
    try {
        while (true) {
            const res = await fetch(`https://api.github.com/search/repositories?q=${query}&page=${page}`, {signal});

        const data = await res.json();

            if (data.items.length === 0) break;

            yield data.items;

            page++
        
        }
    } catch (error) {
        if (error.name === "AbortError") {
            console.log("Fetch aborted")
        } else {
            console.error(error)
        }
    }
        
    
}

function renderResults(repos) {
    
    resultsDiv.innerHTML += repos.map(repo => `<div class="repoDiv"><a href="${repo.html_url}" target="_blank">${repo.full_name}</a></div>`)
}

let loading = false;
let controller = null;

let iterator;

input.addEventListener("input", myDebounce((e) => {

    if (controller) {
        controller.abort();
    }

    controller = new AbortController();

    const query = e.target.value;
    iterator = searchGithub(query, controller.signal);

    resultsDiv.innerHTML = ""

    loadNext()
    

}, 400));




async function loadNext() {
    if (!iterator) return;
    loading = true;

    if (loading) {
        loader.classList.remove("loadview")
    } 
    const { value, done } = await iterator.next();

    if (done) return;

    renderResults(value)

    loading = false;
    if(!loading) {
        loader.classList.add("loadview")
    }
}



const observ = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting && !loading) {
            loadNext();
        }
    })
})


observ.observe(observedDiv);


