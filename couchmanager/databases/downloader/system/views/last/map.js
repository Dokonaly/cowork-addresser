function (doc) {
	var d = {
		type: doc.type,
		hash: doc.hash,
		created: doc.created,
		last_changed: doc.last_changed
	};

	emit(['all'], d);
}