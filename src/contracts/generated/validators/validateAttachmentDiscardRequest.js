// generated/raw-validators/validateAttachmentDiscardRequest.js
var validateAttachmentDiscardRequest = validate116;
function validate116(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate116.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.attachment_ids === void 0 && (missing0 = "attachment_ids")) {
			validate116.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "attachment_ids" || key0 === "data_generation_id")) {
				validate116.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.attachment_ids !== void 0) {
				let data0 = data.attachment_ids;
				if (Array.isArray(data0)) {
					const len0 = data0.length;
					for (let i0 = 0; i0 < len0; i0++) if (typeof data0[i0] !== "string") {
						validate116.errors = [{
							instancePath: instancePath + "/attachment_ids/" + i0,
							schemaPath: "#/properties/attachment_ids/items/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
				} else {
					validate116.errors = [{
						instancePath: instancePath + "/attachment_ids",
						schemaPath: "#/properties/attachment_ids/type",
						keyword: "type",
						params: { type: "array" },
						message: "must be array"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.data_generation_id !== void 0) {
					if (typeof data.data_generation_id !== "string") {
						validate116.errors = [{
							instancePath: instancePath + "/data_generation_id",
							schemaPath: "#/properties/data_generation_id/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
			}
		}
	} else {
		validate116.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate116.errors = vErrors;
	return true;
}
validate116.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateAttachmentDiscardRequest };
