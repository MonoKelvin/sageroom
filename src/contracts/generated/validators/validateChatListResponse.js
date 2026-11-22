import { t as require_ucs2length } from "./ucs2length.js";
// generated/raw-validators/validateChatListResponse.js
var validateChatListResponse = validate132;
var schema187 = {
	"enum": ["0.3"],
	"type": "string"
};
var func2 = require_ucs2length().default;
var pattern4 = /* @__PURE__ */ new RegExp("^(0|[1-9][0-9]*)$", "u");
var schema180 = {
	"additionalProperties": false,
	"properties": {
		"created_at": {
			"format": "int64",
			"maximum": 9007199254740991,
			"minimum": -9007199254740991,
			"type": "integer"
		},
		"id": { "type": "string" },
		"mention_all": { "type": "boolean" },
		"mention_ids": {
			"items": { "type": "string" },
			"type": "array"
		},
		"parts": {
			"items": { "$ref": "#/$defs/MessagePart" },
			"type": "array"
		},
		"quote_message_id": { "type": ["string", "null"] },
		"sender_id": { "type": "string" },
		"seq": { "$ref": "#/$defs/DecimalString" },
		"state": { "$ref": "#/$defs/MessageState" }
	},
	"required": [
		"id",
		"seq",
		"sender_id",
		"created_at",
		"state",
		"parts",
		"quote_message_id",
		"mention_ids",
		"mention_all"
	],
	"type": "object"
};
var schema183 = {
	"enum": [
		"visible",
		"recalled",
		"deleted"
	],
	"type": "string"
};
var func1 = Object.prototype.hasOwnProperty;
function validate135(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate135.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.id === void 0 && (missing0 = "id") || data.seq === void 0 && (missing0 = "seq") || data.sender_id === void 0 && (missing0 = "sender_id") || data.created_at === void 0 && (missing0 = "created_at") || data.state === void 0 && (missing0 = "state") || data.parts === void 0 && (missing0 = "parts") || data.quote_message_id === void 0 && (missing0 = "quote_message_id") || data.mention_ids === void 0 && (missing0 = "mention_ids") || data.mention_all === void 0 && (missing0 = "mention_all")) {
				validate135.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!func1.call(schema180.properties, key0)) {
					validate135.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.created_at !== void 0) {
						let data0 = data.created_at;
						const _errs2 = errors;
						if (!(typeof data0 == "number" && !(data0 % 1) && !isNaN(data0) && isFinite(data0))) {
							validate135.errors = [{
								instancePath: instancePath + "/created_at",
								schemaPath: "#/properties/created_at/type",
								keyword: "type",
								params: { type: "integer" },
								message: "must be integer"
							}];
							return false;
						}
						if (errors === _errs2) {
							if (typeof data0 == "number" && isFinite(data0)) {
								if (data0 > 9007199254740991 || isNaN(data0)) {
									validate135.errors = [{
										instancePath: instancePath + "/created_at",
										schemaPath: "#/properties/created_at/maximum",
										keyword: "maximum",
										params: {
											comparison: "<=",
											limit: 9007199254740991
										},
										message: "must be <= 9007199254740991"
									}];
									return false;
								} else if (data0 < -9007199254740991 || isNaN(data0)) {
									validate135.errors = [{
										instancePath: instancePath + "/created_at",
										schemaPath: "#/properties/created_at/minimum",
										keyword: "minimum",
										params: {
											comparison: ">=",
											limit: -9007199254740991
										},
										message: "must be >= -9007199254740991"
									}];
									return false;
								}
							}
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.id !== void 0) {
							const _errs4 = errors;
							if (typeof data.id !== "string") {
								validate135.errors = [{
									instancePath: instancePath + "/id",
									schemaPath: "#/properties/id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.mention_all !== void 0) {
								const _errs6 = errors;
								if (typeof data.mention_all !== "boolean") {
									validate135.errors = [{
										instancePath: instancePath + "/mention_all",
										schemaPath: "#/properties/mention_all/type",
										keyword: "type",
										params: { type: "boolean" },
										message: "must be boolean"
									}];
									return false;
								}
								var valid0 = _errs6 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.mention_ids !== void 0) {
									let data3 = data.mention_ids;
									const _errs8 = errors;
									if (errors === _errs8) {
										if (Array.isArray(data3)) {
											const len0 = data3.length;
											for (let i0 = 0; i0 < len0; i0++) {
												const _errs10 = errors;
												if (typeof data3[i0] !== "string") {
													validate135.errors = [{
														instancePath: instancePath + "/mention_ids/" + i0,
														schemaPath: "#/properties/mention_ids/items/type",
														keyword: "type",
														params: { type: "string" },
														message: "must be string"
													}];
													return false;
												}
												if (!(_errs10 === errors)) break;
											}
										} else {
											validate135.errors = [{
												instancePath: instancePath + "/mention_ids",
												schemaPath: "#/properties/mention_ids/type",
												keyword: "type",
												params: { type: "array" },
												message: "must be array"
											}];
											return false;
										}
									}
									var valid0 = _errs8 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.parts !== void 0) {
										let data5 = data.parts;
										const _errs12 = errors;
										if (errors === _errs12) {
											if (Array.isArray(data5)) {
												const len1 = data5.length;
												for (let i1 = 0; i1 < len1; i1++) {
													let data6 = data5[i1];
													const _errs14 = errors;
													const _errs16 = errors;
													let valid4 = false;
													let passing0 = null;
													const _errs17 = errors;
													if (errors === _errs17) {
														if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
															let missing1;
															if (data6.kind === void 0 && (missing1 = "kind") || data6.text === void 0 && (missing1 = "text")) {
																const err0 = {
																	instancePath: instancePath + "/parts/" + i1,
																	schemaPath: "#/$defs/MessagePart/oneOf/0/required",
																	keyword: "required",
																	params: { missingProperty: missing1 },
																	message: "must have required property '" + missing1 + "'"
																};
																if (vErrors === null) vErrors = [err0];
																else vErrors.push(err0);
																errors++;
															} else {
																const _errs19 = errors;
																for (const key1 in data6) if (!(key1 === "kind" || key1 === "text")) {
																	const err1 = {
																		instancePath: instancePath + "/parts/" + i1,
																		schemaPath: "#/$defs/MessagePart/oneOf/0/additionalProperties",
																		keyword: "additionalProperties",
																		params: { additionalProperty: key1 },
																		message: "must NOT have additional properties"
																	};
																	if (vErrors === null) vErrors = [err1];
																	else vErrors.push(err1);
																	errors++;
																	break;
																}
																if (_errs19 === errors) {
																	if (data6.kind !== void 0) {
																		let data7 = data6.kind;
																		const _errs20 = errors;
																		if (typeof data7 !== "string") {
																			const err2 = {
																				instancePath: instancePath + "/parts/" + i1 + "/kind",
																				schemaPath: "#/$defs/MessagePart/oneOf/0/properties/kind/type",
																				keyword: "type",
																				params: { type: "string" },
																				message: "must be string"
																			};
																			if (vErrors === null) vErrors = [err2];
																			else vErrors.push(err2);
																			errors++;
																		}
																		if ("text" !== data7) {
																			const err3 = {
																				instancePath: instancePath + "/parts/" + i1 + "/kind",
																				schemaPath: "#/$defs/MessagePart/oneOf/0/properties/kind/const",
																				keyword: "const",
																				params: { allowedValue: "text" },
																				message: "must be equal to constant"
																			};
																			if (vErrors === null) vErrors = [err3];
																			else vErrors.push(err3);
																			errors++;
																		}
																		var valid5 = _errs20 === errors;
																	} else var valid5 = true;
																	if (valid5) {
																		if (data6.text !== void 0) {
																			const _errs22 = errors;
																			if (typeof data6.text !== "string") {
																				const err4 = {
																					instancePath: instancePath + "/parts/" + i1 + "/text",
																					schemaPath: "#/$defs/MessagePart/oneOf/0/properties/text/type",
																					keyword: "type",
																					params: { type: "string" },
																					message: "must be string"
																				};
																				if (vErrors === null) vErrors = [err4];
																				else vErrors.push(err4);
																				errors++;
																			}
																			var valid5 = _errs22 === errors;
																		} else var valid5 = true;
																	}
																}
															}
														} else {
															const err5 = {
																instancePath: instancePath + "/parts/" + i1,
																schemaPath: "#/$defs/MessagePart/oneOf/0/type",
																keyword: "type",
																params: { type: "object" },
																message: "must be object"
															};
															if (vErrors === null) vErrors = [err5];
															else vErrors.push(err5);
															errors++;
														}
													}
													var _valid0 = _errs17 === errors;
													if (_valid0) {
														valid4 = true;
														passing0 = 0;
														var props0 = true;
													}
													const _errs24 = errors;
													if (errors === _errs24) {
														if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
															let missing2;
															if (data6.kind === void 0 && (missing2 = "kind") || data6.attachment_id === void 0 && (missing2 = "attachment_id")) {
																const err6 = {
																	instancePath: instancePath + "/parts/" + i1,
																	schemaPath: "#/$defs/MessagePart/oneOf/1/required",
																	keyword: "required",
																	params: { missingProperty: missing2 },
																	message: "must have required property '" + missing2 + "'"
																};
																if (vErrors === null) vErrors = [err6];
																else vErrors.push(err6);
																errors++;
															} else {
																const _errs26 = errors;
																for (const key2 in data6) if (!(key2 === "attachment_id" || key2 === "kind")) {
																	const err7 = {
																		instancePath: instancePath + "/parts/" + i1,
																		schemaPath: "#/$defs/MessagePart/oneOf/1/additionalProperties",
																		keyword: "additionalProperties",
																		params: { additionalProperty: key2 },
																		message: "must NOT have additional properties"
																	};
																	if (vErrors === null) vErrors = [err7];
																	else vErrors.push(err7);
																	errors++;
																	break;
																}
																if (_errs26 === errors) {
																	if (data6.attachment_id !== void 0) {
																		const _errs27 = errors;
																		if (typeof data6.attachment_id !== "string") {
																			const err8 = {
																				instancePath: instancePath + "/parts/" + i1 + "/attachment_id",
																				schemaPath: "#/$defs/MessagePart/oneOf/1/properties/attachment_id/type",
																				keyword: "type",
																				params: { type: "string" },
																				message: "must be string"
																			};
																			if (vErrors === null) vErrors = [err8];
																			else vErrors.push(err8);
																			errors++;
																		}
																		var valid6 = _errs27 === errors;
																	} else var valid6 = true;
																	if (valid6) {
																		if (data6.kind !== void 0) {
																			let data10 = data6.kind;
																			const _errs29 = errors;
																			if (typeof data10 !== "string") {
																				const err9 = {
																					instancePath: instancePath + "/parts/" + i1 + "/kind",
																					schemaPath: "#/$defs/MessagePart/oneOf/1/properties/kind/type",
																					keyword: "type",
																					params: { type: "string" },
																					message: "must be string"
																				};
																				if (vErrors === null) vErrors = [err9];
																				else vErrors.push(err9);
																				errors++;
																			}
																			if ("attachment" !== data10) {
																				const err10 = {
																					instancePath: instancePath + "/parts/" + i1 + "/kind",
																					schemaPath: "#/$defs/MessagePart/oneOf/1/properties/kind/const",
																					keyword: "const",
																					params: { allowedValue: "attachment" },
																					message: "must be equal to constant"
																				};
																				if (vErrors === null) vErrors = [err10];
																				else vErrors.push(err10);
																				errors++;
																			}
																			var valid6 = _errs29 === errors;
																		} else var valid6 = true;
																	}
																}
															}
														} else {
															const err11 = {
																instancePath: instancePath + "/parts/" + i1,
																schemaPath: "#/$defs/MessagePart/oneOf/1/type",
																keyword: "type",
																params: { type: "object" },
																message: "must be object"
															};
															if (vErrors === null) vErrors = [err11];
															else vErrors.push(err11);
															errors++;
														}
													}
													var _valid0 = _errs24 === errors;
													if (_valid0 && valid4) {
														valid4 = false;
														passing0 = [passing0, 1];
													} else {
														if (_valid0) {
															valid4 = true;
															passing0 = 1;
															if (props0 !== true) props0 = true;
														}
														const _errs31 = errors;
														if (errors === _errs31) {
															if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
																let missing3;
																if (data6.kind === void 0 && (missing3 = "kind") || data6.emote_id === void 0 && (missing3 = "emote_id")) {
																	const err12 = {
																		instancePath: instancePath + "/parts/" + i1,
																		schemaPath: "#/$defs/MessagePart/oneOf/2/required",
																		keyword: "required",
																		params: { missingProperty: missing3 },
																		message: "must have required property '" + missing3 + "'"
																	};
																	if (vErrors === null) vErrors = [err12];
																	else vErrors.push(err12);
																	errors++;
																} else {
																	const _errs33 = errors;
																	for (const key3 in data6) if (!(key3 === "emote_id" || key3 === "kind")) {
																		const err13 = {
																			instancePath: instancePath + "/parts/" + i1,
																			schemaPath: "#/$defs/MessagePart/oneOf/2/additionalProperties",
																			keyword: "additionalProperties",
																			params: { additionalProperty: key3 },
																			message: "must NOT have additional properties"
																		};
																		if (vErrors === null) vErrors = [err13];
																		else vErrors.push(err13);
																		errors++;
																		break;
																	}
																	if (_errs33 === errors) {
																		if (data6.emote_id !== void 0) {
																			const _errs34 = errors;
																			if (typeof data6.emote_id !== "string") {
																				const err14 = {
																					instancePath: instancePath + "/parts/" + i1 + "/emote_id",
																					schemaPath: "#/$defs/MessagePart/oneOf/2/properties/emote_id/type",
																					keyword: "type",
																					params: { type: "string" },
																					message: "must be string"
																				};
																				if (vErrors === null) vErrors = [err14];
																				else vErrors.push(err14);
																				errors++;
																			}
																			var valid7 = _errs34 === errors;
																		} else var valid7 = true;
																		if (valid7) {
																			if (data6.kind !== void 0) {
																				let data12 = data6.kind;
																				const _errs36 = errors;
																				if (typeof data12 !== "string") {
																					const err15 = {
																						instancePath: instancePath + "/parts/" + i1 + "/kind",
																						schemaPath: "#/$defs/MessagePart/oneOf/2/properties/kind/type",
																						keyword: "type",
																						params: { type: "string" },
																						message: "must be string"
																					};
																					if (vErrors === null) vErrors = [err15];
																					else vErrors.push(err15);
																					errors++;
																				}
																				if ("emote" !== data12) {
																					const err16 = {
																						instancePath: instancePath + "/parts/" + i1 + "/kind",
																						schemaPath: "#/$defs/MessagePart/oneOf/2/properties/kind/const",
																						keyword: "const",
																						params: { allowedValue: "emote" },
																						message: "must be equal to constant"
																					};
																					if (vErrors === null) vErrors = [err16];
																					else vErrors.push(err16);
																					errors++;
																				}
																				var valid7 = _errs36 === errors;
																			} else var valid7 = true;
																		}
																	}
																}
															} else {
																const err17 = {
																	instancePath: instancePath + "/parts/" + i1,
																	schemaPath: "#/$defs/MessagePart/oneOf/2/type",
																	keyword: "type",
																	params: { type: "object" },
																	message: "must be object"
																};
																if (vErrors === null) vErrors = [err17];
																else vErrors.push(err17);
																errors++;
															}
														}
														var _valid0 = _errs31 === errors;
														if (_valid0 && valid4) {
															valid4 = false;
															passing0 = [passing0, 2];
														} else if (_valid0) {
															valid4 = true;
															passing0 = 2;
															if (props0 !== true) props0 = true;
														}
													}
													if (!valid4) {
														const err18 = {
															instancePath: instancePath + "/parts/" + i1,
															schemaPath: "#/$defs/MessagePart/oneOf",
															keyword: "oneOf",
															params: { passingSchemas: passing0 },
															message: "must match exactly one schema in oneOf"
														};
														if (vErrors === null) vErrors = [err18];
														else vErrors.push(err18);
														errors++;
														validate135.errors = vErrors;
														return false;
													} else {
														errors = _errs16;
														if (vErrors !== null) {
															if (_errs16) vErrors.length = _errs16;
															else vErrors = null;
														}
													}
													if (!(_errs14 === errors)) break;
												}
											} else {
												validate135.errors = [{
													instancePath: instancePath + "/parts",
													schemaPath: "#/properties/parts/type",
													keyword: "type",
													params: { type: "array" },
													message: "must be array"
												}];
												return false;
											}
										}
										var valid0 = _errs12 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.quote_message_id !== void 0) {
											let data13 = data.quote_message_id;
											const _errs38 = errors;
											if (typeof data13 !== "string" && data13 !== null) {
												validate135.errors = [{
													instancePath: instancePath + "/quote_message_id",
													schemaPath: "#/properties/quote_message_id/type",
													keyword: "type",
													params: { type: schema180.properties.quote_message_id.type },
													message: "must be string,null"
												}];
												return false;
											}
											var valid0 = _errs38 === errors;
										} else var valid0 = true;
										if (valid0) {
											if (data.sender_id !== void 0) {
												const _errs40 = errors;
												if (typeof data.sender_id !== "string") {
													validate135.errors = [{
														instancePath: instancePath + "/sender_id",
														schemaPath: "#/properties/sender_id/type",
														keyword: "type",
														params: { type: "string" },
														message: "must be string"
													}];
													return false;
												}
												var valid0 = _errs40 === errors;
											} else var valid0 = true;
											if (valid0) {
												if (data.seq !== void 0) {
													let data15 = data.seq;
													const _errs42 = errors;
													if (errors === errors) {
														if (typeof data15 === "string") {
															if (func2(data15) > 19) {
																validate135.errors = [{
																	instancePath: instancePath + "/seq",
																	schemaPath: "#/$defs/DecimalString/maxLength",
																	keyword: "maxLength",
																	params: { limit: 19 },
																	message: "must NOT have more than 19 characters"
																}];
																return false;
															} else if (!pattern4.test(data15)) {
																validate135.errors = [{
																	instancePath: instancePath + "/seq",
																	schemaPath: "#/$defs/DecimalString/pattern",
																	keyword: "pattern",
																	params: { pattern: "^(0|[1-9][0-9]*)$" },
																	message: "must match pattern \"^(0|[1-9][0-9]*)$\""
																}];
																return false;
															}
														} else {
															validate135.errors = [{
																instancePath: instancePath + "/seq",
																schemaPath: "#/$defs/DecimalString/type",
																keyword: "type",
																params: { type: "string" },
																message: "must be string"
															}];
															return false;
														}
													}
													var valid0 = _errs42 === errors;
												} else var valid0 = true;
												if (valid0) {
													if (data.state !== void 0) {
														let data16 = data.state;
														const _errs45 = errors;
														if (typeof data16 !== "string") {
															validate135.errors = [{
																instancePath: instancePath + "/state",
																schemaPath: "#/$defs/MessageState/type",
																keyword: "type",
																params: { type: "string" },
																message: "must be string"
															}];
															return false;
														}
														if (!(data16 === "visible" || data16 === "recalled" || data16 === "deleted")) {
															validate135.errors = [{
																instancePath: instancePath + "/state",
																schemaPath: "#/$defs/MessageState/enum",
																keyword: "enum",
																params: { allowedValues: schema183.enum },
																message: "must be equal to one of the allowed values"
															}];
															return false;
														}
														var valid0 = _errs45 === errors;
													} else var valid0 = true;
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate135.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate135.errors = vErrors;
	return errors === 0;
}
validate135.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate134(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate134.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.items === void 0 && (missing0 = "items") || data.first_seq === void 0 && (missing0 = "first_seq") || data.last_seq === void 0 && (missing0 = "last_seq") || data.has_more_before === void 0 && (missing0 = "has_more_before") || data.has_more_after === void 0 && (missing0 = "has_more_after") || data.latest_message_seq === void 0 && (missing0 = "latest_message_seq") || data.latest_event_seq === void 0 && (missing0 = "latest_event_seq")) {
				validate134.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "first_seq" || key0 === "has_more_after" || key0 === "has_more_before" || key0 === "items" || key0 === "last_seq" || key0 === "latest_event_seq" || key0 === "latest_message_seq")) {
					validate134.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.data_generation_id !== void 0) {
						const _errs2 = errors;
						if (typeof data.data_generation_id !== "string") {
							validate134.errors = [{
								instancePath: instancePath + "/data_generation_id",
								schemaPath: "#/properties/data_generation_id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.first_seq !== void 0) {
							let data1 = data.first_seq;
							const _errs4 = errors;
							const _errs5 = errors;
							let valid1 = false;
							const _errs6 = errors;
							if (errors === errors) {
								if (typeof data1 === "string") {
									if (func2(data1) > 19) {
										const err0 = {
											instancePath: instancePath + "/first_seq",
											schemaPath: "#/$defs/DecimalString/maxLength",
											keyword: "maxLength",
											params: { limit: 19 },
											message: "must NOT have more than 19 characters"
										};
										if (vErrors === null) vErrors = [err0];
										else vErrors.push(err0);
										errors++;
									} else if (!pattern4.test(data1)) {
										const err1 = {
											instancePath: instancePath + "/first_seq",
											schemaPath: "#/$defs/DecimalString/pattern",
											keyword: "pattern",
											params: { pattern: "^(0|[1-9][0-9]*)$" },
											message: "must match pattern \"^(0|[1-9][0-9]*)$\""
										};
										if (vErrors === null) vErrors = [err1];
										else vErrors.push(err1);
										errors++;
									}
								} else {
									const err2 = {
										instancePath: instancePath + "/first_seq",
										schemaPath: "#/$defs/DecimalString/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									};
									if (vErrors === null) vErrors = [err2];
									else vErrors.push(err2);
									errors++;
								}
							}
							var _valid0 = _errs6 === errors;
							valid1 = valid1 || _valid0;
							const _errs9 = errors;
							if (data1 !== null) {
								const err3 = {
									instancePath: instancePath + "/first_seq",
									schemaPath: "#/properties/first_seq/anyOf/1/type",
									keyword: "type",
									params: { type: "null" },
									message: "must be null"
								};
								if (vErrors === null) vErrors = [err3];
								else vErrors.push(err3);
								errors++;
							}
							var _valid0 = _errs9 === errors;
							valid1 = valid1 || _valid0;
							if (!valid1) {
								const err4 = {
									instancePath: instancePath + "/first_seq",
									schemaPath: "#/properties/first_seq/anyOf",
									keyword: "anyOf",
									params: {},
									message: "must match a schema in anyOf"
								};
								if (vErrors === null) vErrors = [err4];
								else vErrors.push(err4);
								errors++;
								validate134.errors = vErrors;
								return false;
							} else {
								errors = _errs5;
								if (vErrors !== null) {
									if (_errs5) vErrors.length = _errs5;
									else vErrors = null;
								}
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.has_more_after !== void 0) {
								const _errs11 = errors;
								if (typeof data.has_more_after !== "boolean") {
									validate134.errors = [{
										instancePath: instancePath + "/has_more_after",
										schemaPath: "#/properties/has_more_after/type",
										keyword: "type",
										params: { type: "boolean" },
										message: "must be boolean"
									}];
									return false;
								}
								var valid0 = _errs11 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.has_more_before !== void 0) {
									const _errs13 = errors;
									if (typeof data.has_more_before !== "boolean") {
										validate134.errors = [{
											instancePath: instancePath + "/has_more_before",
											schemaPath: "#/properties/has_more_before/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid0 = _errs13 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.items !== void 0) {
										let data4 = data.items;
										const _errs15 = errors;
										if (errors === _errs15) {
											if (Array.isArray(data4)) {
												const len0 = data4.length;
												for (let i0 = 0; i0 < len0; i0++) {
													const _errs17 = errors;
													if (!validate135(data4[i0], {
														instancePath: instancePath + "/items/" + i0,
														parentData: data4,
														parentDataProperty: i0,
														rootData,
														dynamicAnchors
													})) {
														vErrors = vErrors === null ? validate135.errors : vErrors.concat(validate135.errors);
														errors = vErrors.length;
													}
													if (!(_errs17 === errors)) break;
												}
											} else {
												validate134.errors = [{
													instancePath: instancePath + "/items",
													schemaPath: "#/properties/items/type",
													keyword: "type",
													params: { type: "array" },
													message: "must be array"
												}];
												return false;
											}
										}
										var valid0 = _errs15 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.last_seq !== void 0) {
											let data6 = data.last_seq;
											const _errs18 = errors;
											const _errs19 = errors;
											let valid4 = false;
											const _errs20 = errors;
											if (errors === errors) {
												if (typeof data6 === "string") {
													if (func2(data6) > 19) {
														const err5 = {
															instancePath: instancePath + "/last_seq",
															schemaPath: "#/$defs/DecimalString/maxLength",
															keyword: "maxLength",
															params: { limit: 19 },
															message: "must NOT have more than 19 characters"
														};
														if (vErrors === null) vErrors = [err5];
														else vErrors.push(err5);
														errors++;
													} else if (!pattern4.test(data6)) {
														const err6 = {
															instancePath: instancePath + "/last_seq",
															schemaPath: "#/$defs/DecimalString/pattern",
															keyword: "pattern",
															params: { pattern: "^(0|[1-9][0-9]*)$" },
															message: "must match pattern \"^(0|[1-9][0-9]*)$\""
														};
														if (vErrors === null) vErrors = [err6];
														else vErrors.push(err6);
														errors++;
													}
												} else {
													const err7 = {
														instancePath: instancePath + "/last_seq",
														schemaPath: "#/$defs/DecimalString/type",
														keyword: "type",
														params: { type: "string" },
														message: "must be string"
													};
													if (vErrors === null) vErrors = [err7];
													else vErrors.push(err7);
													errors++;
												}
											}
											var _valid1 = _errs20 === errors;
											valid4 = valid4 || _valid1;
											const _errs23 = errors;
											if (data6 !== null) {
												const err8 = {
													instancePath: instancePath + "/last_seq",
													schemaPath: "#/properties/last_seq/anyOf/1/type",
													keyword: "type",
													params: { type: "null" },
													message: "must be null"
												};
												if (vErrors === null) vErrors = [err8];
												else vErrors.push(err8);
												errors++;
											}
											var _valid1 = _errs23 === errors;
											valid4 = valid4 || _valid1;
											if (!valid4) {
												const err9 = {
													instancePath: instancePath + "/last_seq",
													schemaPath: "#/properties/last_seq/anyOf",
													keyword: "anyOf",
													params: {},
													message: "must match a schema in anyOf"
												};
												if (vErrors === null) vErrors = [err9];
												else vErrors.push(err9);
												errors++;
												validate134.errors = vErrors;
												return false;
											} else {
												errors = _errs19;
												if (vErrors !== null) {
													if (_errs19) vErrors.length = _errs19;
													else vErrors = null;
												}
											}
											var valid0 = _errs18 === errors;
										} else var valid0 = true;
										if (valid0) {
											if (data.latest_event_seq !== void 0) {
												let data7 = data.latest_event_seq;
												const _errs25 = errors;
												if (errors === errors) {
													if (typeof data7 === "string") {
														if (func2(data7) > 19) {
															validate134.errors = [{
																instancePath: instancePath + "/latest_event_seq",
																schemaPath: "#/$defs/DecimalString/maxLength",
																keyword: "maxLength",
																params: { limit: 19 },
																message: "must NOT have more than 19 characters"
															}];
															return false;
														} else if (!pattern4.test(data7)) {
															validate134.errors = [{
																instancePath: instancePath + "/latest_event_seq",
																schemaPath: "#/$defs/DecimalString/pattern",
																keyword: "pattern",
																params: { pattern: "^(0|[1-9][0-9]*)$" },
																message: "must match pattern \"^(0|[1-9][0-9]*)$\""
															}];
															return false;
														}
													} else {
														validate134.errors = [{
															instancePath: instancePath + "/latest_event_seq",
															schemaPath: "#/$defs/DecimalString/type",
															keyword: "type",
															params: { type: "string" },
															message: "must be string"
														}];
														return false;
													}
												}
												var valid0 = _errs25 === errors;
											} else var valid0 = true;
											if (valid0) {
												if (data.latest_message_seq !== void 0) {
													let data8 = data.latest_message_seq;
													const _errs28 = errors;
													if (errors === errors) {
														if (typeof data8 === "string") {
															if (func2(data8) > 19) {
																validate134.errors = [{
																	instancePath: instancePath + "/latest_message_seq",
																	schemaPath: "#/$defs/DecimalString/maxLength",
																	keyword: "maxLength",
																	params: { limit: 19 },
																	message: "must NOT have more than 19 characters"
																}];
																return false;
															} else if (!pattern4.test(data8)) {
																validate134.errors = [{
																	instancePath: instancePath + "/latest_message_seq",
																	schemaPath: "#/$defs/DecimalString/pattern",
																	keyword: "pattern",
																	params: { pattern: "^(0|[1-9][0-9]*)$" },
																	message: "must match pattern \"^(0|[1-9][0-9]*)$\""
																}];
																return false;
															}
														} else {
															validate134.errors = [{
																instancePath: instancePath + "/latest_message_seq",
																schemaPath: "#/$defs/DecimalString/type",
																keyword: "type",
																params: { type: "string" },
																message: "must be string"
															}];
															return false;
														}
													}
													var valid0 = _errs28 === errors;
												} else var valid0 = true;
											}
										}
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate134.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate134.errors = vErrors;
	return errors === 0;
}
validate134.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate133(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate133.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate133.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "data" || key0 === "schema_version")) {
					validate133.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.data !== void 0) {
						const _errs2 = errors;
						if (!validate134(data.data, {
							instancePath: instancePath + "/data",
							parentData: data,
							parentDataProperty: "data",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate134.errors : vErrors.concat(validate134.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate133.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate133.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema187.enum },
									message: "must be equal to one of the allowed values"
								}];
								return false;
							}
							var valid0 = _errs3 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate133.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate133.errors = vErrors;
	return errors === 0;
}
validate133.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema189 = {
	"additionalProperties": false,
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"field_path": { "type": ["string", "null"] },
		"may_have_been_charged": { "type": "boolean" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"trace_id": { "type": "string" }
	},
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	],
	"type": "object"
};
var schema190 = {
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	],
	"type": "string"
};
var schema191 = {
	"enum": [
		"never",
		"retry",
		"after_user_action"
	],
	"type": "string"
};
function validate140(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate140.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate140.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "field_path" || key0 === "may_have_been_charged" || key0 === "message" || key0 === "retryability" || key0 === "trace_id")) {
				validate140.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate140.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate140.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema190.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.field_path !== void 0) {
					let data1 = data.field_path;
					if (typeof data1 !== "string" && data1 !== null) {
						validate140.errors = [{
							instancePath: instancePath + "/field_path",
							schemaPath: "#/properties/field_path/type",
							keyword: "type",
							params: { type: schema189.properties.field_path.type },
							message: "must be string,null"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.may_have_been_charged !== void 0) {
						if (typeof data.may_have_been_charged !== "boolean") {
							validate140.errors = [{
								instancePath: instancePath + "/may_have_been_charged",
								schemaPath: "#/properties/may_have_been_charged/type",
								keyword: "type",
								params: { type: "boolean" },
								message: "must be boolean"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.message !== void 0) {
							if (typeof data.message !== "string") {
								validate140.errors = [{
									instancePath: instancePath + "/message",
									schemaPath: "#/properties/message/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.retryability !== void 0) {
								let data4 = data.retryability;
								if (typeof data4 !== "string") {
									validate140.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "never" || data4 === "retry" || data4 === "after_user_action")) {
									validate140.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/enum",
										keyword: "enum",
										params: { allowedValues: schema191.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.trace_id !== void 0) {
									if (typeof data.trace_id !== "string") {
										validate140.errors = [{
											instancePath: instancePath + "/trace_id",
											schemaPath: "#/properties/trace_id/type",
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
					}
				}
			}
		}
	} else {
		validate140.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate140.errors = vErrors;
	return true;
}
validate140.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate139(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate139.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate139.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "error" || key0 === "schema_version")) {
					validate139.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.error !== void 0) {
						const _errs2 = errors;
						if (!validate140(data.error, {
							instancePath: instancePath + "/error",
							parentData: data,
							parentDataProperty: "error",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate140.errors : vErrors.concat(validate140.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate139.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate139.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema187.enum },
									message: "must be equal to one of the allowed values"
								}];
								return false;
							}
							var valid0 = _errs3 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate139.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate139.errors = vErrors;
	return errors === 0;
}
validate139.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate132(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate132.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate133(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate133.errors : vErrors.concat(validate133.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate139(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate139.errors : vErrors.concat(validate139.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate132.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate132.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate132.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
export { validateChatListResponse };
