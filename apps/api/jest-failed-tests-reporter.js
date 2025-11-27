class FailedFilesReporter {
	onRunComplete(_, results) {
		const failed = results.testResults
			.filter((r) => r.numFailingTests > 0)
			.map((r) => r.testFilePath);

		if (failed.length === 0) return;

		console.log(`\n❌ Failed test files (${failed.length}):`);
		failed.forEach((f) => console.log(' -', f));
	}
}

module.exports = FailedFilesReporter;
