function (doc){
	var d = {
		_id: doc._id,
		date_start: doc.date_start,
		date_end: doc.date_end,
		status: doc.status,
		name: doc.name,
		description: doc.description,
		creator: doc.creator,
		last_changed: doc.last_changed
	};

	emit(doc._id, d);
}