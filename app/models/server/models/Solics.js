/* eslint-disable linebreak-style */
import { Base } from './_Base';

export class Solics extends Base {
	constructor() {
		super('solics');
		this.tryEnsureIndex({ rid: 1 });
		this.tryEnsureIndex({ userId: 1 });
	}

	createOrUpdate(data) {
		return this.insert(data);
	}
}

export default new Solics();
