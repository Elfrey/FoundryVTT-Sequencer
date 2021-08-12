export default class SequencerDatabaseViewer extends FormApplication {

	constructor(dialogData={}, options={}) {
		super(dialogData, options);
		this.filter = "all"
		this.search = "";
		this.autoplay = true;
		this.packs = Object.keys(window.SequencerDatabase.entries);
		this.entries = window.SequencerDatabase.flattenedEntries.map(entry => {
			return {
				pack: entry.split('.')[0],
				entry: entry
			};
		});
		this.list = false;
	}

	getFilteredEntries(search=""){
		let searchParts = search.split(" ");
		let regex = new RegExp(searchParts.join("|"), "g");
		return this.entries.filter(part => {
			return (this.filter === "all" || this.filter === part.pack)
				&& (search === "" || part.entry.match(regex)?.length >= searchParts.length);
		});
	}

	refreshView(html){

		if(!this.list) this.list = html.find(".database-entries");
		this.list.empty();

		let search = this.search.replace(/[^A-Za-z0-9 .*_-]/g, "")
			.replace(".", "\.")
			.replace("*", "(.*?)");

		let filteredEntries = this.getFilteredEntries(search);

		let regex = new RegExp(search.split(" ").join("|"), "g");

		filteredEntries.forEach(part => {
			let entry = search !== "" ? part.entry.replace(regex, (str) => {
				return `<mark>${str}</mark>`
			}) : part.entry;
			this.list.append(`<div><a class="click-copy">${entry}</a></div>`)
		});

		let self = this;
		$("#sequencer-database-form").find('.click-copy').click(function(){
			self.copyText(this);
			self.playVideo.bind(self)($(this).text());
		});

	}

	/* -------------------------------------------- */

	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			title: "Sequencer Database Viewer",
			template: `modules/sequencer/templates/sequencer-database-template.html`,
			classes: ["dialog"],
			width: 900,
			height: 425,
		});
	}

	/* -------------------------------------------- */

	/** @override */
	getData() {
		let data = super.getData();
		data.packs = this.packs;
		data.entries = this.getFilteredEntries();
		return data;
	}

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);
		let self = this;

		let filter = html.find('select[name="pack-select"]');
		let input = html.find('input[name="search-field"]');
		this.player = html.find('.database-player')[0];

		html.find('#auto-play').change(function(){
			self.autoplay = $(this).is(":checked");
		});

		let filterDebounce = debounce(() => {
			this.search = input.val();
			this.filter = filter.val();
			this.refreshView(html);
		}, 500)

		filter.change(filterDebounce);
		input.keyup(filterDebounce);

		$("#sequencer-database-form").find('.click-copy').click(function(){
			self.copyText(this);
			self.playVideo.bind(self)($(this).text());
		});
	}

	playVideo(entryText){
		if(!this.autoplay) return;

		let entry = SequencerDatabase.getEntry(entryText);

		entry = entry?.file ?? entry;

		this.player.onerror = () => {
			let error = `Sequencer Database Viewer | Could not play file: ${entry}`;
			ui.notifications.error(error);
			console.error(error);
		}

		this.player.oncanplay = () => {
			this.player.play();
		}

		this.player.src = entry;
	}

	copyText(elem){
		let tempInput = document.createElement("input");
		tempInput.value = `"${$(elem).text()}"`;
		document.body.appendChild(tempInput);
		tempInput.select();
		document.execCommand("copy");
		document.body.removeChild(tempInput);
		document.execCommand('copy');

		$(elem).fadeOut(100).fadeIn(100).fadeOut(100).fadeIn(100);

		let tempElem = $("<i class='toRemove'> - Copied!</i>");

		$(elem).parent().parent().find(".toRemove").remove();

		$(elem).parent().append(tempElem);

		setTimeout(() => {
			$(elem).parent().find(".toRemove").remove();
		}, 1000);
	}

	async _updateObject(event, formData) {}

}