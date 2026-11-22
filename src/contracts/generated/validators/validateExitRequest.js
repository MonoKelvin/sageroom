// generated/raw-validators/validateExitRequest.js
var validateExitRequest = validate198;
var schema266 = {
	"$schema": "https://json-schema.org/draft/2020-12/schema",
	"additionalProperties": false,
	"properties": { "data_generation_id": {
		"default": null,
		"type": ["string", "null"]
	} },
	"title": "ExitRequest",
	"type": "object"
};
function validate198(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate198.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		for (const key0 in data) if (!(key0 === "data_generation_id")) {
			validate198.errors = [{
				instancePath,
				schemaPath: "#/additionalProperties",
				keyword: "additionalProperties",
				params: { additionalProperty: key0 },
				message: "must NOT have additional properties"
			}];
			return false;
		}
		if (data.data_generation_id !== void 0) {
			let data0 = data.data_generation_id;
			if (typeof data0 !== "string" && data0 !== null) {
				validate198.errors = [{
					instancePath: instancePath + "/data_generation_id",
					schemaPath: "#/properties/data_generation_id/type",
					keyword: "type",
					params: { type: schema266.properties.data_generation_id.type },
					message: "must be string,null"
				}];
				return false;
			}
		}
	} else {
		validate198.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate198.errors = vErrors;
	return true;
}
validate198.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateExitRequest };
