import {Command, flags} from '@oclif/command'
import axios from 'axios'
import {chain} from 'lodash'
const asciichart = require('asciichart')
const Table = require('cli-table3')
const {URLSearchParams} = require('url')

interface RolloutDataNode {
  date: Date;
  cumVaccinationFirstDoseUptakeByPublishDatePercentage: number;
  cumVaccinationSecondDoseUptakeByPublishDatePercentage: number;
  cumPeopleVaccinatedFirstDoseByPublishDate: number;
  cumPeopleVaccinatedSecondDoseByPublishDate: number;
  newPeopleVaccinatedFirstDoseByPublishDate: number;
  newPeopleVaccinatedSecondDoseByPublishDate: number;
  newCasesByPublishDate: number;
  newDeaths28DaysByPublishDate: number;
}

class UkCovidStats extends Command {
  static flags = {
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    graph: flags.boolean({char: 'g', default: false}),
    'all-time': flags.boolean({char: 'a', default: false}),
  }

  async run() {
    const {flags} = this.parse(UkCovidStats)

    const baseUrl = 'https://coronavirus.data.gov.uk/api/v1/data'
    const structure = {
      areaType: 'areaType',
      areaName: 'areaName',
      areaCode: 'areaCode',
      date: 'date',
      newPeopleVaccinatedFirstDoseByPublishDate: 'newPeopleVaccinatedFirstDoseByPublishDate',
      newPeopleVaccinatedSecondDoseByPublishDate: 'newPeopleVaccinatedSecondDoseByPublishDate',
      cumPeopleVaccinatedFirstDoseByPublishDate: 'cumPeopleVaccinatedFirstDoseByPublishDate',
      cumPeopleVaccinatedSecondDoseByPublishDate: 'cumPeopleVaccinatedSecondDoseByPublishDate',
      cumVaccinationFirstDoseUptakeByPublishDatePercentage: 'cumVaccinationFirstDoseUptakeByPublishDatePercentage',
      cumVaccinationSecondDoseUptakeByPublishDatePercentage: 'cumVaccinationSecondDoseUptakeByPublishDatePercentage',
      newCasesByPublishDate: 'newCasesByPublishDate',
      newDeaths28DaysByPublishDate: 'newDeaths28DaysByPublishDate',
    }

    const params = {
      filters: 'areaName=United%2520Kingdom;areaType=overview&',
      structure: JSON.stringify(structure),
      format: 'json',
    }

    const response = await axios.get(`${baseUrl}?${new URLSearchParams(params).toString()}`)
    const rolloutData: RolloutDataNode[] = chain(response.data.data)
    .orderBy(['date', 'asc'])
    .reject(['cumPeopleVaccinatedFirstDoseByPublishDate', null])
    .value()

    const limitedRolloutData = flags['all-time'] ? rolloutData : rolloutData.slice(Math.max(rolloutData.length - 7, 1))

    const rolloutTable = new Table({
      head: ['Date', 'First Dose %', 'Second Dose %', 'Daily First Doses', 'Daily Second Doses', 'Daily Total Doses', 'All Time First Doses', 'All Time Second Doses', 'All Time Doses', 'Daily Cases', 'Daily Deaths'],
    })

    limitedRolloutData.forEach(row => {
      rolloutTable.push([
        row.date,
        `${(row.cumVaccinationFirstDoseUptakeByPublishDatePercentage || 0).toFixed(1)}%`,
        `${(row.cumVaccinationSecondDoseUptakeByPublishDatePercentage || 0).toFixed(1)}%`,
        this.formatNumber(row.newPeopleVaccinatedFirstDoseByPublishDate || 0),
        this.formatNumber(row.newPeopleVaccinatedSecondDoseByPublishDate || 0),
        this.formatNumber(row.newPeopleVaccinatedFirstDoseByPublishDate + row.newPeopleVaccinatedSecondDoseByPublishDate),
        this.formatNumber(row.cumPeopleVaccinatedFirstDoseByPublishDate || 0),
        this.formatNumber(row.cumPeopleVaccinatedSecondDoseByPublishDate || 0),
        this.formatNumber(row.cumPeopleVaccinatedFirstDoseByPublishDate + row.cumPeopleVaccinatedSecondDoseByPublishDate),
        row.newCasesByPublishDate ? this.formatNumber(row.newCasesByPublishDate) : 'Unknown',
        row.newDeaths28DaysByPublishDate ? this.formatNumber(row.newDeaths28DaysByPublishDate) : 'Unknown',
      ])
    })

    this.log('')
    this.log(rolloutTable.toString())

    if (flags.graph) {
      const firstDoseChart = new Array(limitedRolloutData.length)
      const secondDoseChart = new Array(limitedRolloutData.length)

      limitedRolloutData.forEach((row, index: number) => {
        firstDoseChart[index] = row.cumVaccinationFirstDoseUptakeByPublishDatePercentage
        secondDoseChart[index] = row.cumVaccinationSecondDoseUptakeByPublishDatePercentage
      })

      this.log('')
      this.log('Dose %')
      this.log('- 1st Dose: Blue')
      this.log('- 2nd Dose: Green')
      this.log('')

      const config = {
        colors: [
          asciichart.blue,
          asciichart.green,
        ],
      }

      this.log(asciichart.plot([firstDoseChart, secondDoseChart], config))
    }

    this.log('Data for the last 5 days may be incomplete.')
    this.log('')
  }

  private formatNumber(number: number): string {
    return new Intl.NumberFormat('en-GB').format(number)
  }
}

export = UkCovidStats
